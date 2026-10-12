# SPEC — JEV / Decision Pipeline

> **Статус:** согласована; реализована в обоих вариантах (вехи M1–M5). Отклонения от первоначального черновика внесены в текст.
> Источник истины для обоих вариантов: `react/` и `go/`.

## 0. Решения шага 1 «Опрос»

| Вопрос | Решение |
|---|---|
| Варианты | два независимых: `react/` и `go/`, делаются параллельно |
| React | Vite + TypeScript + React 19 + React Three Fiber + drei + postprocessing + zustand |
| Go | **Ebitengine v2.10** (Go ≥ 1.25): десктоп-окно + браузер через WebAssembly |
| Данные | симуляция (`metrics illustrative`), без API и LLM |
| Кейсы | 4 из референсов + 8 придуманных по аналогии |
| Поведение | автопроигрывание по кругу, 8 с на кейс; клики по кейсам и этапам; пауза |
| Кадр | вертикальный 1240×1568 (пропорции референсов), равномерно масштабируется под окно |
| Точность | максимально близко к референсам; подпись автора → `centralhub · demo` |
| Публикация | локально + PR |

**Не входит:** реальный бэкенд, экспорт видео, GitHub Pages, тач-адаптация (кроме масштабирования).

---

## 1. Структура папки

```
JEV-Decision-Pipeline/
├── README.md
├── SPEC.md                 ← этот файл
├── references/             ← 4 скриншота-референса
├── shared/                 ← общий контракт (создаёт оркестратор, воркерам только чтение)
│   ├── cases.json          ← 12 кейсов: цвета, путь по карточкам, ответы, тексты
│   ├── cards.json          ← каталог карточек 5 колонок
│   ├── schema/*.json       ← JSON Schema для cases/cards
│   ├── chief.py            ← текст для панели chief.py
│   ├── test-vectors.json   ← эталонные входы/выходы sim для паритета React ↔ Go
│   └── fonts/              ← JetBrains Mono (OFL), 400/700/800
├── react/                  ← вариант 1
└── go/                     ← вариант 2
```

- React читает `shared/` напрямую (Vite `server.fs.allow`).
- Go не может делать `go:embed` из родительской папки, поэтому `go generate` копирует `shared/` в
  `go/internal/assets/shared/`. Тест сверяет SHA-256 копии с оригиналом, так что копия не может разойтись молча.

---

## 2. Архитектура (общая для обоих вариантов)

**Главный принцип: кадр — чистая функция `frame = sim(t, seed)`.**

- `t` — секунды «времени шоу». Пауза замораживает `t`, клик по кейсу или этапу перематывает `t`.
- Кроме `t`, `seed` и пользовательского ввода, скрытого состояния нет. Отсюда детерминированные кадры
  для тестов и одинаковое поведение React и Go.
- Случайность: PRNG **mulberry32** (uint32-арифметика, одинаково в TS и Go). Под-сиды: `hash32(seed, канал, индекс)`.

| Слой | Ответственность |
|---|---|
| `sim` | таймлайн, KPI, генераторы (лог, бары, печать кода), без рендера |
| `theme` | базовая палитра + акцент кейса, плавная перекраска |
| `scene` | 3D: колонки карточек, связи, частицы, сетка, камера |
| `fx` | bloom, depth of field, виньетка, зерно |
| `ui` | шапка, KPI, заголовок кейса, нижние панели, футер |
| `input` | мышь, клавиатура, URL-параметры (браузер) / флаги (десктоп) |

Для e2e-тестов оба варианта отдают `window.__jev.state()` → `{ case, stage, t, paused }`.

---

## 3. Кадр и сетка вёрстки

Логический кадр **1240×1568 px**, масштаб `min(W/1240, H/1568)`, по краям фон `#05070B`.
Сцена рисуется на весь кадр под UI; сверху (y < 200) и снизу (y > 1150) затемняется градиентом.

| Зона | y, px | Содержимое |
|---|---|---|
| Шапка | 16–48 | `JEV / DECISION PIPELINE` · `SYSTEM ONE · jev-1.13.0` · `STATE → QUESTIONS → JEV → GATE → CODE` · `centralhub · demo` |
| KPI | 58–188 | 4 карточки по ≈296 px, зазор 10 |
| Заголовок кейса | 196–262 | бейдж `CASE NN / 12`, название, подзаголовок, 5 кнопок этапов справа |
| Сцена | 262–1180 | 3D-колонки |
| Панели, ряд 1 | 1186–1396 | Parallel questions (14–312) · Confidence stream (322–612) · 12 use cases (626–920) · chief.py (932–1228) |
| Панели, ряд 2 | 1404–1524 | Run log (14–498) · The split (506–870) · Guardrails (878–1228) |
| Футер | 1532–1568 | `LLM WRITES · JEV DECIDES · CODE ACTS` · таймлайн · `metrics illustrative · prices and gate from the article` |

---

## 4. Визуальный стиль

**Шрифт:** JetBrains Mono, локально, без сетевых запросов.

| Токен | Значение |
|---|---|
| фон | `#05070B` |
| фон панели | `rgba(10,14,22,0.88)`, рамка `#1E2636`, радиус 6 |
| текст | основной `#E8EDF5`, вторичный `#7D8AA0`, приглушённый `#4A5568` |
| типы вопросов (фиксированы) | Choice `#FF5C8A` · Score `#4FD1E8` · Noul `#C6F23A` |
| колонки сцены (фиксированы) | STATE `#4FD1E8` · QUESTIONS `#FF5C8A` · JEV `#A99BFF` · GATE `#F7B731` · CODE `#C6F23A` |
| вердикт | PASS всегда `#C6F23A` (в любой теме), REVIEW `#FF9F43` |
| теги лога | ask `#C9D1DD` · jev `#5B9BFF` · gate `#F7B731` · code `#4FD1E8` · limit `#7D8AA0` |

**Акцент кейса** красит: верхние линии KPI, `SYSTEM ONE…`, подпись автора, `≈ $0.42` со свечением, спарклайн,
бейдж CASE, кнопки этапов, активные карточки и путь, плитку текущего кейса, подсветку строки chief.py,
сегменты `actions` и `Jev decides`, маркер таймлайна, правые подписи панелей (`one state`, `SIM`, `case NN`,
`14 l/s`, `8 l/s`, `who does what`, `always on`).
При смене кейса перекраска идёт 400 мс (интерполяция RGB).

---

## 5. Шапка, KPI, заголовок кейса

**KPI** (у каждой карточки верхняя линия 2 px акцентом; подпись 11 px, uppercase; цифры 44 px bold):

1. `DECISIONS · THIS RUN`: число с пробелом-разделителем (`2 191`), 30-сегментный бар = decisions/10 000, `SIM · one loop = 10 000`.
2. `MEDIAN LATENCY · REPORTED`: `~256` + `ms`, спарклайн 110×40 (seeded, бежит влево), тонкий бар с бегущим акцентным отрезком, `public demos · not SLAs`.
3. `COST · 10 000 DECISIONS`: `≈ $0.42` акцентом со свечением; строки `jev` (крошечный акцентный бар) и `LLM` (длинный серый), `$0.042 / M in · out free`.
4. `CONFIDENCE · LIVE`: до этапа GATE показывает `-.--`; на GATE/CODE — уверенность кейса (лайм, count-up 0.3 с) + бейдж `PASS` или `REVIEW`; бар с белой меткой порога 0.85; `calibrate on yours` · `gate 0.85`.

**Заголовок кейса:**
- бейдж `CASE 01 / 12` (заливка акцентом, тёмный текст), название 30 px extra-bold uppercase;
- подзаголовок допечатывается по этапам:

  | Этап | Подзаголовок |
  |---|---|
  | STATE | пусто |
  | ASK, JEV | `Choice · folder` |
  | GATE, CODE | `Choice · folder → phishing 0.97 → quarantine` |

- кнопки `STATE ASK JEV GATE CODE` (62×28): пройденный этап — контур акцентом; текущий — заливка акцентом;
  следующий — полупрозрачная пульсирующая заливка; будущие — тусклый контур.

---

## 6. Сцена

### 6.1 Колонки
| # | Заголовок | Цвет линии | Карточек |
|---|---|---|---|
| 01 | `STATE / EVIDENCE` | `#4FD1E8` | 14 |
| 02 | `TYPED / QUESTIONS` | `#FF5C8A` | 12 |
| 03 | `JEV / SYSTEM ONE` | `#A99BFF` | 8 |
| 04 | `GATE / ROUTE` | `#F7B731` | 10 |
| 05 | `CODE / ACTS` | `#C6F23A` | 10 |

Карточки идут вертикальной стопкой с шагом 1.25 условной единицы, между колонками 3.0 единицы, у колонок небольшой
сдвиг по высоте (±0.3). Сзади висит стена-сетка (шаг 1, линии `#1A2130`, затухание с расстоянием),
снизу — штрихи «пола».

### 6.2 Карточка
- Размер 2.3×1.0 ед. (≈ 230×100 px при среднем зуме). Фон `rgba(13,19,32,0.9)`, рамка `#2A3348`, радиус 6.
- Квадратный маркер цвета колонки + заголовок (bold 15 px); три строки `лейбл … значение` (11 px).
  Значение с флагом `hl` выделяется цветом колонки. Внизу слева короткая черта цвета колонки.
- Текст рисуется в 2D-текстуру (2× плотность), текстура натягивается на 3D-плоскость.
  Подход одинаковый в React (CanvasTexture) и Go (offscreen `ebiten.Image`).
- **Активная карточка:** рамка и свечение акцентом, заливка акцентом на 12 %, нижняя плашка акцентом с тёмным текстом:
  STATE `state packed · evidence`, ASK `typed question · asked`, JEV `→ phishing · 0.97`,
  GATE `0.97 ≥ 0.85 · pass` (или `0.79 < 0.85 · human`), CODE `done · code acts`.
- Карточки пройденных этапов текущего кейса остаются подсвеченными: путь накапливается, как на референсе 01.

### 6.3 Связи и частицы
- От каждой карточки колонки *i* к 2–4 карточкам колонки *i+1* (seeded) идут кубические Безье с горизонтальными касательными.
  Всего связей ≈ 200. Цвета: 55 % белые, 15 % розовые, 12 % голубые, 10 % лаймовые, 8 % лавандовые; alpha `0.10 + 0.18·h`, где `h = (hash32(seed, 9, i) % 1000) / 1000`; цвета без подмешивания белого; аддитивное смешение (под bloom более яркие связи сливались в белые «реки»).
- Частицы: ≈ 1500 точек бегут по связям со скоростью 0.15–0.5 длины связи в секунду, плюс ≈ 300 пылинок в пустоте. Свечение даёт bloom.
- **Активный путь:** между соседними активными карточками — толстая (3–5 px) лента акцентом; за время этапа по ней проходит яркий шар
  с ореолом, по прибытии на целевой карточке вспышка.

### 6.4 Камера
Перспектива, FOV 35°. Поза — чистая функция `cameraPose(t)`: один и тот же `t` даёт один и тот же кадр. Правило одинаковое в React и Go.

| Этап | yaw | pitch | roll | дистанция | Характер (референс) |
|---|---|---|---|---|---|
| STATE | +18° | −8° | −4° | 21 | сильный наклон |
| ASK | +14° | −6° | −3° | 19 | как 08 Inbound lead |
| JEV | +4° | −3° | 0° | 23 | фронтально, как 04 X feed |
| GATE | −6° | −2° | 0° | 19 | крупно, как 02 YouTube |
| CODE | −3° | 0° | 0° | 25 | широко, видны заголовки и сетка, как 01 Email |

- **Цель этапа:** `(0.5·cx, cy − 1.5, 0)`, где `(cx, cy)` = `cardPosition` карточки этапа в пути кейса. Сдвиг вниз поднимает активную карточку выше центра сцены, как на референсах.
- **Позиция:** цель + дистанция · `(sin yaw · cos pitch, −sin pitch, cos yaw · cos pitch)`; `up` — ось +Y, повёрнутая на `roll` вокруг направления взгляда.
- **Переход:** линейный бленд yaw/pitch/roll/дистанции/цели от предыдущего этапа, `k = easeOutCubic(min(1, stageElapsed / 0.9))`. Для STATE «предыдущий» — CODE предыдущего кейса.
- **Покачивание:** yaw += 1.5°·sin(0.4·t), pitch += 0.8°·sin(0.31·t + 1).
- **Центр проекции** смещён так, что цель попадает в точку кадра (620, 721) — центр зоны сцены.
- **Depth of field:** фокус на активной карточке, края кадра размыты.

---|---|---|---|---|---|
| STATE | +18° | −8° | −4° | 9 | сильный наклон |
| ASK | +14° | −6° | −3° | 8 | как 08 Inbound lead |
| JEV | +4° | −3° | 0° | 10 | фронтально, как 04 X feed |
| GATE | −6° | −2° | 0° | 8 | крупно, как 02 YouTube |
| CODE | −3° | 0° | 0° | 11 | широко, видны заголовки и сетка, как 01 Email |

Переходы — критически задемпфированная пружина (≈ 0.9 с) плюс медленное покачивание ±1.5°.
**Depth of field:** фокус на активной карточке, края кадра размыты.

---

## 7. Нижние панели

| Панель | Правая подпись | Содержимое и анимация |
|---|---|---|
| **Parallel questions** | `one state` | 6 строк `Choice A/B`, `Score A/B`, `Noul A/B`: бар (цвет типа) + белая засечка, справа ответ (победитель яркий, остальные тусклые). На старте ASK бары растут 0 → значение (0.6 с, сдвиг 60 мс). Значения seeded по кейсу, у типа вопроса кейса победитель ≥ 0.9. Футер `three answers ≈ one cheap decision` |
| **Confidence stream** | `SIM` | 3 кривые Choice/Score/Noul (1.5 px), диапазон 0.55–1.05, сумма синусов + шум, скролл 40 px/с; пунктир 0.85 с подписью; легенда + `under → human` |
| **12 use cases** | `case NN` | сетка 3×4, плитка `01` / `email`. Текущая — заливка акцентом и ■; 0–2 плитки с точкой «в очереди» (seeded). Клик → переход к кейсу |
| **chief.py** | `14 l/s` | `shared/chief.py` печатается посимвольно, по кругу; видно 11 строк со скроллом. Подсветка: ключевые слова розовым, классы голубым, комментарии тусклым; текущая строка — фон акцентом 18 % + блочный курсор |
| **Run log** | `8 l/s` | 5 видимых строк, плавный скролл. Колонки: тег (цвет по типу) + сообщение. События текущего кейса (`ask Choice · folder`, `jev → phishing 0.97 3ms`, `gate 0.97 ≥ 0.85 pass`, `code mail → quarantine`) вперемешку с фоновыми событиями параллельных решений и `limit actions 7/10 spend ok` примерно раз в 4 с |
| **The split** | `who does what` | 3 строки по 20 сегментов: `LLM writes` (серый, 4/20), **`Jev decides`** (акцент, 18/20), `code acts` (голубой, 15/20); лёгкое мерцание ±1 сегмент |
| **Guardrails** | `always on` | `spend cap` — лаймовый бар, `$0.29 / 1.00`; `actions` — 10 сегментов, `n / 10`; замок + `never auto-post to X · progress saved` янтарным |

**Футер:** штрихи через 8 px, акцентный маркер на позиции decisions/10 000.

---

## 8. Тайминги и формулы

| Параметр | Значение |
|---|---|
| Этапы | STATE 1.2 с · ASK 1.6 · JEV 1.6 · GATE 1.6 · CODE 2.0 = **8.0 с на кейс** |
| Старт этапов внутри кейса | 0 · 1.2 · 2.8 · 4.4 · 6.0 |
| Цикл кейсов | 12 × 8 = 96 с, затем по кругу |
| Прогон решений | `decisions = floor(10000 · frac(t / 150))` — **не связан** с циклом кейсов (на референсах номер кейса и счётчик не коррелируют) |
| Расход | `spend = decisions × 0.000042` (сходится с референсами: 511 → $0.02, 6 856 → $0.29) |
| actions | случайное блуждание в 3..8, шаг раз в ≈ 2 с (seeded) |
| Перекраска темы | 400 мс |
| Скорости chief.py / Run log | константы, подбираются на ревью (подписи `14 l/s`, `8 l/s` — как в референсе) |

**Управление:**
- клик по плитке — переход к кейсу; клик по кнопке этапа — переход к этапу текущего кейса;
- `Space` — пауза; `←` / `→` — предыдущий / следующий кейс; `F` — вкл/выкл пост-эффекты.

**Параметры:** URL (`?t=&seed=&paused=&case=&stage=&fx=`) в браузере, такие же флаги у Go-десктопа.

---

## 9. 12 кейсов

Акценты разнесены по цветовому кругу примерно через 30°. Кейсы 01, 02, 04, 08 взяты с референсов, остальные придуманы по аналогии.

| # | id | Заголовок | Акцент | STATE | ASK | JEV → ответ | GATE | CODE | Лог CODE |
|---|---|---|---|---|---|---|---|---|---|
| 01 | email | EMAIL TRIAGE | `#FF5C5C` | email | Choice · folder | choice head → phishing 0.97 | quarantine | mail moved | mail → quarantine |
| 02 | youtube | YOUTUBE COMMENT | `#C6F23A` | comment | Noul · worth_reply | noul head → yes 0.91 | draft reply | LLM writes | reply → drafted |
| 03 | skool | SKOOL THREAD | `#B57BFF` | skool thread | Choice · next_worker | choice head → write 0.93 | type_destination | LLM writes | typed + submit |
| 04 | xfeed | X FEED POST | `#FF4FA0` | post | Score · viral_fit | score head → high 0.92 | draft_short | review folder | draft → review folder |
| 05 | meetings | MEETING NOTES | `#2EE6D6` | transcript | Choice · owner | choice head → team 0.90 | assign_owner | task created | 3 tasks → team |
| 06 | clips | CLIP CUT | `#FF8A3D` | clip | Score · hook_strength | score head → strong 0.88 | draft_short | progress saved | cut → saved |
| 07 | contracts | CONTRACT REVIEW | `#5B7CFF` | contract | Score · clause_risk | score head → high **0.79** | review | human gate | → human · REVIEW |
| 08 | leads | INBOUND LEAD | `#F7B731` | lead · DM | Score · lead_quality | score head → high 0.94 | book_call | calendar | link → sent |
| 09 | braindump | BRAIN DUMP | `#E36BFF` | brain dump | Choice · next_worker | choice head → research 0.86 | type_destination | progress saved | job → saved |
| 10 | support | SUPPORT TICKET | `#4CB8FF` | ticket | Score · urgency | score head → critical 0.95 | eng_oncall | Slack ping | ping → on-call |
| 11 | trading | MARKET SIGNAL | `#34E8A0` | market tick | Noul · enter_trade | noul head → yes 0.87 | paper_trade | order logged | paper order → logged |
| 12 | agents | BROWSER AGENT | `#8A7BFF` | DOM state | Choice · action | choice head → click 0.96 | gate ≥ 0.85 (gateLabel `execute`) | code clicks | click + outcome check |

Кейс 07 намеренно не проходит порог: показывает ветку `REVIEW → human`.

---

## 10. Каталог карточек

Порядок в колонках как на референсах, новые карточки добавлены в конец. `*` — значение с подсветкой `hl`.

**01 STATE**
| id | Заголовок | Строки |
|---|---|---|
| s.email | email | from: vendor-lookalike.tld · spf_pass: false* · subject: invoice #4412 |
| s.comment | comment | text: how did you wire… · likes: 40 · video: systems |
| s.lead | lead · DM | source: inbound · budget: mentioned* · timeline: 2 weeks |
| s.dom | DOM state | goal: flight < $400 · actions: 5 visible* · last_error: null |
| s.post | post | views: 48 210* · watchlist: true · floor: 5 000 |
| s.ticket | ticket | plan: enterprise* · category: billing · prior: 3 |
| s.brief | brief | tools: research 3 tools · sources: 2 sources · topic: pricing |
| s.run | agent run | steps: 2 · last_error: null · evidence: real, not vibes |
| s.thread | skool thread | member: new · asks: how to start? · replies: 0 |
| s.transcript | transcript | length: 42 min · speakers: 4 · open: 3 actions* |
| s.clip | clip | length: 0:47 · hook: 2.1 s* · retention: 61% |
| s.contract | contract | clauses: 38 · party: new vendor · term: auto-renew* |
| s.note | brain dump | words: 1 240 · topics: 7* · due: friday |
| s.tick | market tick | symbol: ETH · move: +2.4%* · position: flat |

**02 TYPED / QUESTIONS**
| id | Заголовок | Строки |
|---|---|---|
| q.folder | Choice · folder | options: 5 · labels: billing \| phishing* · policy: in the text |
| q.worth_reply | Noul · worth_reply | type: yes / no* · confidence: attached · owner: creator |
| q.lead_quality | Score · lead_quality | labels: low .. high* · ordered: true · floor: 0.85 |
| q.action | Choice · action | menu: legal only · rebuilt: every click* · options: 5 |
| q.viral_fit | Score · viral_fit | labels: low .. high* · floor: 5k views · desk: content |
| q.urgency | Score · urgency | labels: 4 · range: low .. critical* · team: routed |
| q.next_worker | Choice · next_worker | options: research \| write* · criteria: 3 · then: route |
| q.safe_to_run | Noul · safe_to_run | default: false* · goes to: human · irreversible: gated |
| q.owner | Choice · owner | options: you \| team \| later* · from: transcript · due: inferred |
| q.hook | Score · hook_strength | labels: weak .. strong* · window: first 3 s · floor: 0.85 |
| q.clause_risk | Score · clause_risk | labels: low .. high* · scope: 38 clauses · owner: legal |
| q.enter_trade | Noul · enter_trade | type: yes / no* · size: capped · mode: paper |

**03 JEV / SYSTEM ONE**
| id | Заголовок | Строки |
|---|---|---|
| j.parallel | parallel questions | share: one state* · latency: barely adds · n: 3 |
| j.choice_head | choice head | picks: one label · confidence: 0.93* · prose: none |
| j.no_generation | no generation | chat: off* · output: structured · tokens out: free |
| j.state_encoder | state encoder | input: JSON-ish · tokens: ~1k* · evidence: packed |
| j.score_head | score head | rates: ordered · confidence: 0.91* · prose: none |
| j.median_latency | median latency | reported: ~256 ms* · demo: public · SLA: no |
| j.noul_head | noul head | answers: yes / no · confidence: 0.88* · prose: none |
| j.cost | cost | input: $0.042 / M* · output: free · 10k: ≈ $0.42 |

При активации у head-карточки `confidence` меняется на уверенность текущего кейса.

**04 GATE / ROUTE**
| id | Заголовок | Строки |
|---|---|---|
| g.gate | gate ≥ 0.85 | floor: 0.85* · calibrate: on yours · kind: starting |
| g.quarantine | quarantine | when: phishing · wakes LLM: no* · by: code |
| g.draft_reply | draft reply | when: worth it · writer: LLM · after: the gate* |
| g.book_call | book_call | when: high* · else: nurture · path: calendar |
| g.type_destination | type_destination | picked by: Jev* · typed by: small model · then: submit |
| g.draft_short | draft_short | fit: strong · folder: review · post: you* |
| g.eng_oncall | eng_oncall | when: critical* · ping: Slack · tier: enterprise |
| g.review | review | when: < 0.85* · goes to: human · or: bigger LLM |
| g.assign_owner | assign_owner | picked by: Jev · writes: task* · then: notify |
| g.paper_trade | paper_trade | when: yes · size: capped* · mode: paper |

**05 CODE / ACTS**
| id | Заголовок | Строки |
|---|---|---|
| c.mail_moved | mail moved | folder: quarantine* · time: ms · cost: ~0 |
| c.llm_writes | LLM writes | reply: public · only: now* · tokens: well spent |
| c.calendar | calendar | link: sent* · lead: qualified · template: none |
| c.code_clicks | code clicks | DOM: click · outcome: checked* · resume: saved |
| c.review_folder | review folder | draft: saved · auto-post: never* · you: hit Post |
| c.slack_ping | Slack ping | to: on-call* · ticket: routed · sla: kept |
| c.progress_saved | progress saved | after: every call · resume: last step* · dupes: none |
| c.human_gate | human gate | owns: risky calls · publish: never auto* · limits: 10 actions |
| c.task_created | task created | tracker: tasks · owner: team* · due: friday |
| c.order_logged | order logged | venue: paper · size: 0.5%* · stop: set |

---

## 11. Вариант React (`react/`)

```
react/
├── package.json      pnpm; vite, react, three, @react-three/fiber, @react-three/drei,
│                     @react-three/postprocessing, zustand, vitest, @playwright/test
├── src/sim/          чистая логика + *.test.ts (те же test-vectors)
├── src/theme/
├── src/scene/        Columns, Card (CanvasTexture), Links (Line2), Particles (Points + shader),
│                     ActivePath, Grid, CameraRig, Effects (Bloom, DepthOfField, Vignette, Noise)
├── src/ui/           Header, KpiRow, CaseHeader, panels/*, Footer — DOM поверх canvas
├── src/input/
└── e2e/              Playwright: кадры F1–F4, интерактив, отчёт side-by-side
```
- Один источник времени — `useFrame`. UI обновляется не чаще 30 Гц: цифры через refs, без лишних ре-рендеров React.
- UI-слой — DOM 1240×1568 с `transform: scale()` синхронно с canvas.
- Версии пакетов — актуальные стабильные на старте, фиксируются в `pnpm-lock.yaml`.

## 12. Вариант Go (`go/`)

```
go/
├── go.mod                 go 1.25, github.com/hajimehoshi/ebiten/v2 v2.10.x
├── cmd/jev/main.go        вход для десктопа и WASM
├── internal/sim/          чистая логика + *_test.go (те же test-vectors)
├── internal/theme/
├── internal/scene/        своя mat4-математика, проекция, сортировка по глубине
├── internal/ui/           шапка, KPI, панели — всё рисуется в Ebitengine
├── internal/fx/           Kage-шейдеры: bloom, blur (DOF), виньетка + зерно
├── internal/assets/       копия shared/ (go generate) + go:embed
├── web/index.html         загрузчик WASM (+ wasm_exec.js из $(go env GOROOT)/lib/wasm)
└── Makefile               run · test · wasm · serve · e2e
```
- Ebitengine — 2D-движок, поэтому 3D делается вручную:
  - карточка = текстура, натянутая на спроецированный четырёхугольник, разбитый на сетку 8×4 (иначе аффинное искажение);
  - порядок отрисовки — по глубине.
- Связи — полилинии Безье → `DrawTriangles` с `BlendLighter`. Частицы рисуются одним батчем.
- Bloom: порог → уменьшение ×4 → разделяемый гаусс (Kage) → аддитивное наложение.
- DOF приближённо: дальние от фокуса карточки рисуются в отдельный слой, который размывается.
- Текст: `text/v2` + встроенный JetBrains Mono. HiDPI учитывается через `LayoutF` и device scale factor.
- В браузере URL-параметры читаются через `syscall/js` (файл с build-тегом `js`), `window.__jev` отдаётся туда же.
- e2e гоняются на WASM-сборке тем же Playwright.

---

## 13. Тесты (шаг 3)

1. **Unit `sim`** (Vitest / `go test`), по TDD — тесты пишутся до реализации:
   - таймлайн: t → кейс, этап, прогресс; границы (0, 1.2, 7.999, 8.0, 96 → wrap);
   - переходы `jumpToCase` / `jumpToStage`;
   - KPI: decisions, spend, маркер таймлайна, текст и бейдж уверенности, состояния кнопок, подзаголовок;
   - PRNG mulberry32 на эталонных значениях;
   - генераторы: бары, хвост лога, позиция печати кода, плитки «в очереди», actions;
   - данные: `cases.json` и `cards.json` проходят схему; все ссылки на карточки существуют;
     у каждого кейса ровно 5 карточек по своим колонкам; 12 кейсов.
2. **Паритет:** оба `sim` обязаны совпасть 1:1 с `shared/test-vectors.json`.
   Базовые векторы оркестратор считает вручную. Расширенные (лог, бары) генерируются из принятого TS-`sim`
   и фиксируются; Go обязан их пройти.
3. **Смоук рендера:** нет ошибок в консоли, canvas не пустой, нет внешних сетевых запросов.
4. **Визуальные** (Playwright, Chromium + SwiftShader), кадры `?seed=1&paused=1&t=…`:

   | Кадр | t | Состояние | Референс |
   |---|---|---|---|
   | F1 | 7.60 | case 01 · CODE | 01-email-triage-red |
   | F2 | 13.68 | case 02 · GATE | 02-youtube-comment-lime |
   | F3 | 58.48 | case 08 · ASK | 08-inbound-lead-amber |
   | F4 | 28.08 | case 04 · JEV | 04-x-feed-post-pink |

   - `toHaveScreenshot` против утверждённых baseline (maxDiffPixelRatio 0.02: допуск на программный рендер SwiftShader);
   - отчёт «референс | React | Go» в `e2e/report/` для ревью и PR.
5. **Интерактив:** клик по плитке 05 → `CASE 05 / 12`; клик по GATE → этап GATE; `Space` → кадр не меняется 1 с; `←` / `→`.

---

## 14. Оркестрация и изоляция (шаги 4–5)

**Фаза 0 (оркестратор):**
- ставит Go ≥ 1.25 (через mise);
- создаёт `shared/` (данные, схемы, chief.py, шрифты, базовые test-vectors);
- коммитит в ветку треда.

**Фаза 1 (параллельно, 2 воркера):**

| Воркер | git worktree | Ветка | Пишет только в |
|---|---|---|---|
| react-worker | `../wt-react` | `jev/react` | `JEV-Decision-Pipeline/react/**` |
| go-worker | `../wt-go` | `jev/go` | `JEV-Decision-Pipeline/go/**` |

`shared/**` воркеры только читают. Если нужно изменение, воркер запрашивает его, а вносит оркестратор.

**Вехи** (одинаковые для обоих; после каждой ревью оркестратора):

| Веха | Содержание | Проверка |
|---|---|---|
| M1 | `sim` + unit-тесты + паритет | тесты зелёные, запускаю сам |
| M2 | статичная вёрстка UI без 3D | скриншот против референсов |
| M3 | сцена: карточки, колонки, камера, связи, активный путь | кадры F1–F4 |
| M4 | частицы + пост-эффекты | кадры F1–F4, сравнение |
| M5 | интерактив, автопроигрывание, e2e, README | весь набор тестов |

После ревью веха либо принимается (merge в ветку треда), либо возвращается воркеру со списком замечаний.

**Финал:** общий PR с отчётом side-by-side.

---

## 15. Критерии приёмки

1. `react/`: `pnpm i && pnpm dev` открывает дашборд; `pnpm test`, `pnpm e2e`, `pnpm build` проходят.
2. `go/`: `make test`, `make wasm`, `make e2e` проходят; `go build ./cmd/jev` собирает десктоп-версию; `make serve` открывает её в браузере.
3. Оба варианта: 12 кейсов × 5 этапов по 8 с, перекраска темы, всё управление из §8 работает.
4. Кадры F1–F4 по композиции, цветам, активному пути и характеру ракурса соответствуют референсам;
   раскладка зон — в пределах ±8 px от §3.
5. Паритет `sim`: `test-vectors.json` проходит в обоих вариантах.
6. Ни одного внешнего сетевого запроса во время работы.

## 16. Риски и допущения

- **Go:** в Ebitengine нет 3D и DOF «из коробки», поэтому перспектива и размытие пишутся вручную, DOF приближённый.
  Внешне Go-версия будет близка к React, но не идентична пиксель в пиксель.
- Текст на наклонных карточках может мерцать; смягчаем текстурами 2× и линейной фильтрацией.
- В песочнице нет GPU и дисплея:
  - e2e снимаются через программный рендер (SwiftShader), поэтому проверяются статичные кадры, а FPS не измеряется;
  - окно Go-десктопа здесь не показать: десктоп только собирается, визуально проверяется WASM-версия.
- Цвета и тексты 8 новых кейсов — предложение, правятся в `shared/cases.json` без изменения кода.
