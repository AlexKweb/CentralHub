"""Reference implementation (oracle) of the JEV simulation contract.

Normative for both variants: react/src/sim and go/internal/sim must reproduce
shared/test-vectors.json, which is generated from this file by gen_vectors.py.
Semantics are documented in shared/SIM.md. Pure standard library, Python 3.10+.
"""
from __future__ import annotations

import math

M32 = 0xFFFFFFFF

CASES = 12
CASE_SECONDS = 8.0
CYCLE_SECONDS = 96.0
STAGES = ["state", "ask", "jev", "gate", "code"]
STAGE_STARTS = [0.0, 1.2, 2.8, 4.4, 6.0]
STAGE_DURATIONS = [1.2, 1.6, 1.6, 1.6, 2.0]

DECISIONS_LOOP_SECONDS = 150.0
DECISIONS_PER_LOOP = 10000
DECISION_SEGMENTS = 30
COST_PER_DECISION_MICROS = 42  # $0.000042
GATE_HUNDREDTHS = 85

CONF_COUNTUP_SECONDS = 0.3
BALL_TRAVEL = 0.7
ACCENT_BLEND_SECONDS = 0.4
BAR_GROW_SECONDS = 0.6
BAR_STAGGER_SECONDS = 0.06

LOG_SLOTS_PER_SECOND = 2
LOG_SLOTS_PER_CASE = 16
LOG_VISIBLE = 5
LOG_CASE_SLOTS = [3, 6, 9, 12]  # ask, jev, gate, code

CHIEF_CHARS_PER_SECOND = 24
CHIEF_VISIBLE_LINES = 11

ACTIONS_STEP_SECONDS = 2.0
ACTIONS_START, ACTIONS_MIN, ACTIONS_MAX = 5, 3, 8

SPLIT_STEPS_PER_SECOND = 2
SPLIT_BASE = [4, 18, 15]  # LLM writes, Jev decides, code acts
SPLIT_SEGMENTS = 20

SPARK_STEPS_PER_SECOND = 4
SPARK_POINTS = 24

STREAM_HISTORY_SECONDS = 6.5

COLUMN_SPACING = 3.0
CARD_STEP = 1.25
COLUMN_Y = [0.0, -0.35, 0.2, -0.15, 0.1]

TYPES = ["choice", "score", "noul"]
BAR_ROWS = ["Choice A", "Choice B", "Score A", "Score B", "Noul A", "Noul B"]
ANSWERS = {
    "choice": ["research", "write", "review", "billing", "phishing", "sponsor"],
    "score": ["low", "medium", "high", "critical"],
    "noul": ["yes", "no"],
}
LINK_COLORS = [(0.55, "white"), (0.70, "pink"), (0.82, "cyan"), (0.92, "lime"), (1.0, "lavender")]


class Ch:
    """Sub-seed channels for hash32(seed, channel, ...)."""
    LINKS = 1
    BARS = 2
    LOG = 3
    QUEUE = 4
    ACTIONS = 5
    SPLIT = 6
    SPARK = 7
    STREAM = 8
    PARTICLES = 9
    DUST = 10


# ---------------------------------------------------------------- randomness

def hash32(*values: int) -> int:
    """FNV-1a over each value's 4 little-endian bytes, then murmur3 fmix32."""
    h = 0x811C9DC5
    for v in values:
        v &= M32
        for shift in (0, 8, 16, 24):
            h ^= (v >> shift) & 0xFF
            h = (h * 0x01000193) & M32
    h ^= h >> 16
    h = (h * 0x85EBCA6B) & M32
    h ^= h >> 13
    h = (h * 0xC2B2AE35) & M32
    h ^= h >> 16
    return h


def mulberry32(seed: int):
    a = seed & M32

    def rand() -> float:
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = ((a ^ (a >> 15)) * (1 | a)) & M32
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & M32)) & M32) ^ t
        return ((t ^ (t >> 14)) & M32) / 4294967296

    return rand


# ---------------------------------------------------------------- helpers

def norm(t: float) -> float:
    """NaN and negatives clamp to 0."""
    return t if (t == t and t > 0) else 0.0


def clamp(x, lo, hi):
    return lo if x < lo else hi if x > hi else x


def hundredths(conf: float) -> int:
    return math.floor(conf * 100 + 0.5)


def fmt_hundredths(h: int) -> str:
    return f"{h // 100}.{h % 100:02d}"


def fmt_thousands(n: int) -> str:
    s = str(n)
    groups = []
    while len(s) > 3:
        groups.insert(0, s[-3:])
        s = s[:-3]
    groups.insert(0, s)
    return " ".join(groups)


def fmt_money(cents: int) -> str:
    return f"${cents // 100}.{cents % 100:02d}"


def hex_rgb(h: str) -> list[int]:
    return [int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)]


# ---------------------------------------------------------------- timeline

def timeline(t: float) -> dict:
    t = norm(t)
    cycle = math.floor(t / CYCLE_SECONDS)
    tt = t - cycle * CYCLE_SECONDS
    ci = clamp(math.floor(tt / CASE_SECONDS), 0, CASES - 1)
    local = max(0.0, tt - ci * CASE_SECONDS)
    si = 0
    for i in range(5):
        if STAGE_STARTS[i] <= local:
            si = i
    elapsed = local - STAGE_STARTS[si]
    return {
        "cycle": cycle,
        "caseIndex": ci,
        "caseNumber": ci + 1,
        "stageIndex": si,
        "stage": STAGES[si],
        "local": local,
        "stageElapsed": elapsed,
        "stageProgress": min(1.0, elapsed / STAGE_DURATIONS[si]),
        "caseProgress": local / CASE_SECONDS,
    }


def jump_to_case(t: float, ci: int) -> float:
    return math.floor(norm(t) / CYCLE_SECONDS) * CYCLE_SECONDS + ci * CASE_SECONDS


def jump_to_stage(t: float, si: int) -> float:
    return math.floor(norm(t) / CASE_SECONDS) * CASE_SECONDS + STAGE_STARTS[si]


def next_case(t: float) -> float:
    return (math.floor(norm(t) / CASE_SECONDS) + 1) * CASE_SECONDS


def prev_case(t: float) -> float:
    return max(0.0, (math.floor(norm(t) / CASE_SECONDS) - 1) * CASE_SECONDS)


# ---------------------------------------------------------------- KPIs / header

def decisions(t: float) -> int:
    x = norm(t) / DECISIONS_LOOP_SECONDS
    f = x - math.floor(x)
    return min(DECISIONS_PER_LOOP - 1, math.floor(f * DECISIONS_PER_LOOP))


def kpis(t: float) -> dict:
    d = decisions(t)
    cents = (d * COST_PER_DECISION_MICROS + 5000) // 10000
    return {
        "decisions": d,
        "decisionsText": fmt_thousands(d),
        "segments": d * DECISION_SEGMENTS // DECISIONS_PER_LOOP,
        "spendCents": cents,
        "spendText": fmt_money(cents),
        "marker": d / DECISIONS_PER_LOOP,
    }


def confidence(t: float, cases: list) -> dict:
    tl = timeline(t)
    h = hundredths(cases[tl["caseIndex"]]["confidence"])
    if tl["stageIndex"] < 3:
        return {"text": "-.--", "hundredths": None, "badge": None, "fill": 0.0}
    if tl["stageIndex"] == 3:
        shown = math.floor(h * min(1.0, tl["stageElapsed"] / CONF_COUNTUP_SECONDS))
    else:
        shown = h
    return {
        "text": fmt_hundredths(shown),
        "hundredths": shown,
        "badge": "PASS" if h >= GATE_HUNDREDTHS else "REVIEW",
        "fill": shown / 100,
    }


def buttons(si: int) -> list[str]:
    return ["done" if i < si else "current" if i == si else "next" if i == si + 1 else "future" for i in range(5)]


def subtitle(t: float, cases: list) -> str:
    tl = timeline(t)
    c = cases[tl["caseIndex"]]
    if tl["stageIndex"] == 0:
        return ""
    if tl["stageIndex"] < 3:
        return c["question"]
    conf = fmt_hundredths(hundredths(c["confidence"]))
    return f"{c['question']} → {c['answer']} {conf} → {c['gateLabel']}"


def accent(t: float, cases: list) -> list[int]:
    """Accent RGB; blends from the previous case's accent during the first 0.4 s of a case."""
    tl = timeline(t)
    ci = tl["caseIndex"]
    cur = hex_rgb(cases[ci]["accent"])
    k = tl["local"] / ACCENT_BLEND_SECONDS
    if k >= 1:
        return cur
    prev = hex_rgb(cases[(ci + CASES - 1) % CASES]["accent"])
    return [math.floor(prev[i] + (cur[i] - prev[i]) * k + 0.5) for i in range(3)]


# ---------------------------------------------------------------- scene

def plate(stage_index: int, case: dict) -> str:
    h = hundredths(case["confidence"])
    conf = fmt_hundredths(h)
    passed = h >= GATE_HUNDREDTHS
    if stage_index == 0:
        return "state packed · evidence"
    if stage_index == 1:
        return "typed question · asked"
    if stage_index == 2:
        return f"→ {case['answer']} · {conf}"
    if stage_index == 3:
        return f"{conf} ≥ 0.85 · pass" if passed else f"{conf} < 0.85 · human"
    return "done · code acts" if passed else "→ human · review"


def active(t: float, cases: list) -> dict:
    """Lit cards, travelling ball and plates of the current case."""
    tl = timeline(t)
    si = tl["stageIndex"]
    case = cases[tl["caseIndex"]]
    path = case["path"]
    progress = min(1.0, tl["stageProgress"] / BALL_TRAVEL)
    arrived = tl["stageProgress"] >= BALL_TRAVEL
    plates = [{"card": path[i], "text": plate(i, case)} for i in range(si + 1) if i < si or arrived]
    return {
        "lit": path[: si + 1],
        "ball": {"from": path[si - 1] if si > 0 else None, "to": path[si], "progress": progress, "arrived": arrived},
        "plates": plates,
    }


def card_position(column: int, row: int) -> list[float]:
    return [(column - 2) * COLUMN_SPACING, -row * CARD_STEP + COLUMN_Y[column], 0.0]


def link_color(r: float) -> str:
    for limit, name in LINK_COLORS:
        if r < limit:
            return name
    return LINK_COLORS[-1][1]


def links(seed: int, columns: list) -> list[dict]:
    r = mulberry32(hash32(seed, Ch.LINKS))
    out = []
    for i in range(4):
        dst = columns[i + 1]["cards"]
        for card in columns[i]["cards"]:
            n = 3 + math.floor(r() * 4)
            used = set()
            for _ in range(n):
                ti = math.floor(r() * len(dst))
                c = r()
                if ti in used:
                    continue
                used.add(ti)
                out.append({"from": card["id"], "to": dst[ti]["id"], "color": link_color(c)})
    return out


# ---------------------------------------------------------------- panels

def bars(seed: int, ci: int, cases: list) -> list[dict]:
    case = cases[ci]
    r = mulberry32(hash32(seed, Ch.BARS, ci))
    rows = []
    for i, label in enumerate(BAR_ROWS):
        typ = TYPES[i // 2]
        v = 0.05 + 0.9 * r()
        answers = ANSWERS[typ]
        a = answers[math.floor(r() * len(answers))]
        rows.append({"label": label, "type": typ, "value": v, "answer": a})
    win = 2 * TYPES.index(case["type"])
    rows[win]["value"] = 0.9 + 0.1 * r()
    rows[win]["answer"] = case["answer"]
    for row in rows:
        row["bright"] = row["value"] >= 0.85
    return rows


def bar_grow(t: float, i: int) -> float:
    local = timeline(t)["local"]
    return clamp((local - STAGE_STARTS[1] - i * BAR_STAGGER_SECONDS) / BAR_GROW_SECONDS, 0.0, 1.0)


def actions(t: float, seed: int) -> int:
    t = norm(t)
    cycle = math.floor(t / CYCLE_SECONDS)
    steps = min(48, math.floor((t - cycle * CYCLE_SECONDS) / ACTIONS_STEP_SECONDS))
    a = ACTIONS_START
    for j in range(1, steps + 1):
        a = clamp(a + hash32(seed, Ch.ACTIONS, cycle, j) % 3 - 1, ACTIONS_MIN, ACTIONS_MAX)
    return a


def case_line(case: dict, k: int) -> dict:
    """k: 0 ask, 1 jev, 2 gate, 3 code."""
    h = hundredths(case["confidence"])
    conf = fmt_hundredths(h)
    if k == 0:
        return {"tag": "ask", "text": case["question"].replace(" · ", " ")}
    if k == 1:
        return {"tag": "jev", "text": f"→ {case['answer']}  {conf}  {case['jevMs']}ms"}
    if k == 2:
        text = f"{conf} ≥ 0.85  pass" if h >= GATE_HUNDREDTHS else f"{conf} < 0.85  human"
        return {"tag": "gate", "text": text}
    return {"tag": "code", "text": case["logCode"]}


def log_line(m: int, seed: int, cases: list) -> dict:
    s = m % LOG_SLOTS_PER_CASE
    if s in LOG_CASE_SLOTS:
        return case_line(cases[(m // LOG_SLOTS_PER_CASE) % CASES], LOG_CASE_SLOTS.index(s))
    h = hash32(seed, Ch.LOG, m)
    if h % 8 == 0:
        return {"tag": "limit", "text": f"actions {actions(m * 0.5, seed)}/10  spend ok"}
    return case_line(cases[(h >> 3) % CASES], (h >> 8) % 4)


def log(t: float, seed: int, cases: list) -> dict:
    x = norm(t) * LOG_SLOTS_PER_SECOND
    n = math.floor(x)
    lines = [log_line(m, seed, cases) for m in range(max(0, n - LOG_VISIBLE + 1), n + 1)]
    return {"lines": lines, "scroll": x - n}


def queued(t: float, seed: int, ci: int) -> list[int]:
    cycle = math.floor(norm(t) / CYCLE_SECONDS)
    h = hash32(seed, Ch.QUEUE, cycle, ci)
    count = h % 3
    r = mulberry32(h)
    picked = []
    for _ in range(count):
        idx = math.floor(r() * CASES)
        if idx != ci and idx not in picked:
            picked.append(idx)
    return sorted(picked)


def chief(t: float, text: str) -> dict:
    """Typewriter over an endless tape of the file; text must be ASCII and end with a newline."""
    lines = text.split("\n")[:-1]
    n_lines = len(lines)
    pos = math.floor(norm(t) * CHIEF_CHARS_PER_SECOND) % len(text)
    prefix = text[:pos]
    li = prefix.count("\n")
    col = pos - (prefix.rfind("\n") + 1)
    visible = []
    for k in range(li - CHIEF_VISIBLE_LINES + 1, li + 1):
        line = lines[k % n_lines]
        visible.append(line[:col] if k == li else line)
    return {"pos": pos, "line": li, "col": col, "visible": visible}


def split(t: float, seed: int) -> list[int]:
    k = math.floor(norm(t) * SPLIT_STEPS_PER_SECOND)
    return [clamp(SPLIT_BASE[r] + hash32(seed, Ch.SPLIT, k, r) % 3 - 1, 0, SPLIT_SEGMENTS) for r in range(3)]


def spark(t: float, seed: int) -> dict:
    x = norm(t) * SPARK_STEPS_PER_SECOND
    k = math.floor(x)
    return {"values": [180 + (hash32(seed, Ch.SPARK, k + i) % 1000) * 0.12 for i in range(SPARK_POINTS)], "offset": x - k}


def stream(t: float, seed: int, type_index: int, x: float) -> float:
    r = mulberry32(hash32(seed, Ch.STREAM, type_index))
    p0, p1, p2 = (2 * math.pi * r() for _ in range(3))
    s = norm(t) - (1 - x) * STREAM_HISTORY_SECONDS
    return 0.80 + 0.10 * math.sin(1.3 * s + p0) + 0.06 * math.sin(2.9 * s + p1) + 0.03 * math.sin(6.1 * s + p2)


# ---------------------------------------------------------------- data checks

def validate(cases_doc: dict, cards_doc: dict) -> list[str]:
    """Cross-file invariants that JSON Schema cannot express. Returns a list of errors."""
    errors = []
    columns = cards_doc["columns"]
    ids = {}
    for ci, col in enumerate(columns):
        if col["id"] != ["state", "questions", "jev", "gate", "code"][ci]:
            errors.append(f"column {ci} has id {col['id']}")
        for card in col["cards"]:
            if card["id"] in ids:
                errors.append(f"duplicate card id {card['id']}")
            ids[card["id"]] = ci
    cases = cases_doc["cases"]
    if len(cases) != CASES:
        errors.append(f"expected {CASES} cases, got {len(cases)}")
    seen = set()
    titles = {card["id"]: card["title"] for col in columns for card in col["cards"]}
    for i, c in enumerate(cases):
        if c["id"] in seen:
            errors.append(f"duplicate case id {c['id']}")
        seen.add(c["id"])
        for stage, cid in enumerate(c["path"]):
            if cid not in ids:
                errors.append(f"case {c['id']}: unknown card {cid}")
            elif ids[cid] != stage:
                errors.append(f"case {c['id']}: card {cid} is not in column {stage}")
        if titles.get(c["path"][1]) != c["question"]:
            errors.append(f"case {c['id']}: question does not match card {c['path'][1]}")
        if c["question"].split(" · ")[0].lower() != c["type"]:
            errors.append(f"case {c['id']}: type does not match question")
        if c["path"][2] != f"j.{c['type']}_head":
            errors.append(f"case {c['id']}: jev card must be j.{c['type']}_head")
        h = hundredths(c["confidence"])
        if abs(h / 100 - c["confidence"]) > 1e-9:
            errors.append(f"case {c['id']}: confidence must have 2 decimals")
    return errors
