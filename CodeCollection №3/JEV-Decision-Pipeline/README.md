# JEV / Decision Pipeline

Анимированный дашборд-визуализация конвейера принятия решений
**STATE → QUESTIONS → JEV → GATE → CODE**: LLM пишет, Jev решает, код действует.

## Референсы

Скриншоты лежат в [`references/`](references/):

| Кейс | Тема | Файл |
|------|------|------|
| 01 / 12 · Email triage | красная | [01-email-triage-red.png](references/01-email-triage-red.png) |
| 02 / 12 · YouTube comment | лаймовая | [02-youtube-comment-lime.png](references/02-youtube-comment-lime.png) |
| 04 / 12 · X feed post | розовая | [04-x-feed-post-pink.png](references/04-x-feed-post-pink.png) |
| 08 / 12 · Inbound lead | янтарная | [08-inbound-lead-amber.png](references/08-inbound-lead-amber.png) |

## Состав экрана

1. **Шапка**: `JEV / DECISION PIPELINE`, версия `jev-1.13.0`, строка этапов, автор.
2. **Четыре KPI-карточки**:
   - Decisions · this run: счётчик и прогресс-бар;
   - Median latency: `~256 ms` и спарклайн;
   - Cost · 10 000 decisions: `≈ $0.42`;
   - Confidence · live: значение, бейдж `PASS` и порог `gate 0.85`.
3. **Заголовок кейса**: `CASE NN / 12`, название, цепочка решения (например, `Choice · folder → phishing 0.97 → quarantine`)
   и переключатели этапов `STATE / ASK / JEV / GATE / CODE`.
4. **Центральная сцена**: колонки карточек в перспективе (State, Typed questions, JEV/System one, Gate/Route, Code/Acts),
   между ними светящиеся кривые-связи и бегущие частицы. Активный путь подсвечивается цветом кейса.
5. **Нижние панели**: Parallel questions (бары), Confidence stream (график с линией 0.85),
   12 use cases (сетка), `chief.py` (печатающийся код), Run log, The split, Guardrails.
6. **Футер**: `LLM WRITES · JEV DECIDES · CODE ACTS` и таймлайн.

## 12 кейсов

email · youtube · skool · x feed · meetings · clips · contracts · leads · brain-dump · support · trading · agents.
У каждого кейса свой акцентный цвет, и вся тема перекрашивается при смене кейса.
