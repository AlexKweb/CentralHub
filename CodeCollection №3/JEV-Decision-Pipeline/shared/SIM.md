# SIM: контракт симуляции

Общая логика для `react/src/sim` и `go/internal/sim`.
**Нормативный источник:** [`tools/simref.py`](tools/simref.py), эталон на Python, только стандартная библиотека.
Из него `tools/gen_vectors.py` генерирует [`test-vectors.json`](test-vectors.json). Обе реализации обязаны пройти
**все** векторы: числа сравниваются с допуском `tolerance` (1e-9), строки, целые и массивы — точно.

```sh
python3 shared/tools/gen_vectors.py          # пересоздать векторы после правки данных или эталона
python3 shared/tools/gen_vectors.py --check  # проверить, что векторы не устарели (заодно валидирует данные)
```

## Правила порта

- Арифметика `float64` / JS `number`, тот же порядок операций, что в эталоне. `floor` = `Math.floor` / `math.Floor`.
- 32-битная целочисленная арифметика: Go — `uint32` с переполнением; JS — `Math.imul` и `>>> 0`.
- `t` нормализуется так: `NaN` и отрицательные → 0 (`norm`).
- Python `//` и `%` применяются только к неотрицательным целым, поэтому прямой перенос безопасен.
- Строки содержат `·` (U+00B7), `→` (U+2192), `≥` (U+2265), `≈` (U+2248). `chief.py` — только ASCII.
- Имена в TS — camelCase (`jumpToCase`), в Go — PascalCase (`JumpToCase`). Структуры результатов — как в векторах.

## Константы

| Имя | Значение |
|---|---|
| этапы | `state ask jev gate code`; старты `0 1.2 2.8 4.4 6.0`; длительности `1.2 1.6 1.6 1.6 2.0` |
| кейс / цикл | 8 с / 96 с (12 кейсов) |
| `STAGE_EPS` | 1e-9: этап выбирается по `start <= local + EPS`, `stageElapsed = max(0, …)`. Без этого `jumpToStage` из-за округления попадал на предыдущий этап (векторы `stageJumps`) |
| решения | цикл 150 с на 10 000; 30 сегментов; $0.000042 за решение |
| gate | 85 сотых |
| анимации | count-up уверенности 0.3 с; шар доходит за 0.7 этапа; перекраска 0.4 с; рост баров 0.6 с со сдвигом 0.06 |
| лог | 2 слота/с, 16 слотов на кейс, видно 5; события кейса в слотах 3/6/9/12 |
| chief.py | 24 симв./с, видно 11 строк |
| actions | шаг 2 с, старт 5, диапазон 3..8 |
| split | 2 шага/с, база `4 18 15` из 20 |
| sparkline | 4 шага/с, 24 точки |
| stream | окно истории 6.5 с |
| сцена | шаг колонок 3.0, шаг карточек 1.25, сдвиг колонок по Y `0 -0.35 0.2 -0.15 0.1` |

## Функции

| Функция | Результат |
|---|---|
| `hash32(...u32)` | FNV-1a по 4 LE-байтам каждого значения + murmur3 `fmix32` |
| `mulberry32(seed)` | генератор `() → [0,1)` |
| `timeline(t)` | `{cycle, caseIndex, caseNumber, stageIndex, stage, local, stageElapsed, stageProgress, caseProgress}` |
| `jumpToCase(t, ci)` · `jumpToStage(t, si)` · `nextCase(t)` · `prevCase(t)` | новое `t` |
| `kpis(t)` | `{decisions, decisionsText, segments, spendCents, spendText, marker}`; `2 191`, `$0.09` |
| `confidence(t, cases)` | `{text, hundredths, badge, fill}`; до GATE `-.--` и `null`; на GATE count-up |
| `buttons(si)` | 5 × `done` · `current` · `next` · `future` |
| `subtitle(t, cases)` | `""` → `Choice · folder` → `Choice · folder → phishing 0.97 → quarantine` |
| `accent(t, cases)` | `[r,g,b]` 0..255, блендинг от акцента предыдущего кейса первые 0.4 с |
| `active(t, cases)` | `{lit[], ball{from,to,progress,arrived}, plates[{card,text}]}`; плашка текущей карточки появляется после прибытия шара |
| `cardPosition(col, row)` | `[x, y, z]` в мировых единицах |
| `links(seed, columns)` | `[{from,to,color}]`; цвета `white pink cyan lime lavender` |
| `bars(seed, ci, cases)` | 6 строк `{label,type,value,answer,bright}`; у строки «A» типа кейса значение ≥ 0.9 и ответ кейса |
| `barGrow(t, row)` | 0..1 |
| `actions(t, seed)` | 3..8 |
| `log(t, seed, cases)` | `{lines[{tag,text}], scroll}`; теги `ask jev gate code limit` |
| `queued(t, seed, ci)` | индексы плиток с точкой «в очереди» |
| `chief(t, text)` | `{pos, line, col, visible[11]}`; бесконечная лента файла, последняя строка обрезана по курсору |
| `split(t, seed)` | `[llm, jev, code]` из 20 |
| `spark(t, seed)` | `{values[24], offset}`, мс |
| `stream(t, seed, type, x)` | значение кривой, `x` 0 (лево) … 1 (сейчас) |

Каналы `hash32(seed, channel, …)`: LINKS 1 · BARS 2 · LOG 3 · QUEUE 4 · ACTIONS 5 · SPLIT 6 · SPARK 7 · STREAM 8 ·
PARTICLES 9 · DUST 10. Каналы 9–10 зарезервированы для рендера (частицы, пыль) и в паритет не входят.

## Что не входит в контракт

Камера, частицы, пост-эффекты, шрифтовая вёрстка и easing анимаций. Это рендер, он может отличаться между вариантами,
но обязан брать все **данные** кадра из функций выше.
