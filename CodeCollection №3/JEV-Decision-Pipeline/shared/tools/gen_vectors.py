"""Generates shared/test-vectors.json from the oracle (simref.py).

Usage: python3 shared/tools/gen_vectors.py          # write
       python3 shared/tools/gen_vectors.py --check  # fail if the file is stale
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import simref as s

ROOT = Path(__file__).resolve().parent.parent
SEED = 1

TIMES = [0, 0.5, 1.19, 1.2, 2.79, 2.8, 4.4, 4.5, 4.6, 4.75, 5.99, 6.0, 7.6, 7.999, 8.0,
         13.68, 28.08, 52.4, 52.5, 58.48, 95.999, 96, 100.5, 149.99, 150, 1000.25, 12345.678, -3]
FRAMES = {"F1": 7.60, "F2": 13.68, "F3": 58.48, "F4": 28.08}


def main() -> int:
    cases_doc = json.loads((ROOT / "cases.json").read_text("utf-8"))
    cards_doc = json.loads((ROOT / "cards.json").read_text("utf-8"))
    chief_text = (ROOT / "chief.py").read_text("utf-8")
    errors = s.validate(cases_doc, cards_doc)
    if not chief_text.isascii() or not chief_text.endswith("\n"):
        errors.append("chief.py must be ASCII and end with a newline")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    cases = cases_doc["cases"]
    columns = cards_doc["columns"]

    v: dict = {
        "version": 1,
        "seed": SEED,
        "tolerance": 1e-9,
        "frames": FRAMES,
        "hash32": [{"in": vals, "out": s.hash32(*vals)} for vals in
                   [[], [0], [1], [1, 2], [1, 2, 3], [4294967295], [1, s.Ch.LINKS], [42, 3, 1000, 7]]],
        "mulberry32": [{"seed": seed, "out": [r() for r in [s.mulberry32(seed)] for _ in range(5)]}
                       for seed in [0, 1, 42, 3735928559]],
        "timeline": [{"t": t, "out": s.timeline(t)} for t in TIMES],
        "kpis": [{"t": t, "out": s.kpis(t)} for t in TIMES + [3.6, 52.17, 92.34, 129.0]],
        "confidence": [{"t": t, "out": s.confidence(t, cases)} for t in TIMES + [4.5, 4.55, 4.69, 52.0, 54.0]],
        "buttons": [{"stage": i, "out": s.buttons(i)} for i in range(5)],
        "subtitle": [{"t": t, "out": s.subtitle(t, cases)} for t in TIMES + [52.0, 54.0]],
        "accent": [{"t": t, "out": s.accent(t, cases)} for t in [0, 0.1, 0.2, 0.39, 0.4, 8.0, 8.13, 8.3, 50.0, 96.2]],
        "active": [{"t": t, "out": s.active(t, cases)} for t in TIMES + [54.0, 55.5]],
        "cardPosition": [{"column": c, "row": r, "out": s.card_position(c, r)} for c, r in
                         [(0, 0), (0, 13), (1, 3), (2, 7), (3, 1), (4, 9)]],
        "links": {"seed": SEED, "out": s.links(SEED, columns)},
        "bars": [{"seed": seed, "case": ci, "out": s.bars(seed, ci, cases)} for seed in [SEED, 7] for ci in range(12)],
        "barGrow": [{"t": t, "row": i, "out": s.bar_grow(t, i)} for t in [0, 1.2, 1.5, 1.7, 1.9, 2.1, 7.0, 9.5]
                    for i in range(6)],
        "actions": [{"t": t, "out": s.actions(t, SEED)} for t in TIMES + [10, 20, 40, 60, 80, 95]],
        "log": [{"t": t, "out": s.log(t, SEED, cases)} for t in TIMES + [8.26, 30.1, 61.7, 77.77]],
        "queued": [{"t": t, "case": ci, "out": s.queued(t, SEED, ci)} for t in [0, 100, 200, 5000] for ci in range(12)],
        "chief": [{"t": t, "out": s.chief(t, chief_text)} for t in [0, 0.04, 1, 2.5, 10, 33.3, 36.5, 37.9, 80, 1000.25]],
        "split": [{"t": t, "out": s.split(t, SEED)} for t in TIMES],
        "spark": [{"t": t, "out": s.spark(t, SEED)} for t in [0, 0.3, 7.6, 13.68, 1000.25]],
        "stream": [{"t": t, "type": ty, "x": x, "out": s.stream(t, SEED, ty, x)}
                   for t in [0, 7.6, 58.48] for ty in range(3) for x in [0, 0.25, 0.5, 1]],
        "jumps": [{"t": t, "toCase": [s.jump_to_case(t, ci) for ci in (0, 4, 11)],
                   "toStage": [s.jump_to_stage(t, si) for si in range(5)],
                   "next": s.next_case(t), "prev": s.prev_case(t)} for t in [0, 5.5, 13.68, 95.5, 100.0, 1000.25]],
    }
    v["links"]["count"] = len(v["links"]["out"])

    out = json.dumps(v, ensure_ascii=False, indent=1) + "\n"
    path = ROOT / "test-vectors.json"
    if "--check" in sys.argv:
        if path.read_text("utf-8") != out:
            print("test-vectors.json is stale; run gen_vectors.py", file=sys.stderr)
            return 1
        print("test-vectors.json is up to date")
        return 0
    path.write_text(out, "utf-8")
    print(f"wrote {path} ({len(out)} bytes, {v['links']['count']} links)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
