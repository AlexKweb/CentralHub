# JEV / Decision Pipeline: Go

Вариант 2: **Go + Ebitengine v2.10.5**, десктоп и WebAssembly. Спецификация: [SPEC.md](../SPEC.md) (§12, §13), контракт симуляции: [shared/SIM.md](../shared/SIM.md).

## Что это

Шоу «JEV / Decision Pipeline»: 12 кейсов, каждый проходит 5 этапов (STATE → ASK → JEV → GATE → CODE) по 8 с, полный цикл 96 с.
Сцена: колонки карточек в перспективе, связи-Безье, частицы, активный путь с шаром и вспышкой на финише, пост-эффекты (bloom, DOF, виньетка, зерно).
Панели: KPI, заголовок кейса, parallel questions, confidence stream, use cases, chief.py, run log, split, guardrails.

## Стек

- Go ≥ 1.25 (`go 1.25.0` в `go.mod`).
- Ebitengine v2.10.5 (`github.com/hajimehoshi/ebiten/v2`), текст через `text/v2` и встроенный JetBrains Mono.
- Тесты данных: `santhosh-tekuri/jsonschema` v6.0.3.
- e2e: Playwright 1.64.0, pnpm 10.31.0, Chromium (предустановлен).

## Команды

Все команды запускаются из папки `go/`.

- `make test`: `go vet` и `go test ./...`.
- `make run`: десктопное окно (`go run ./cmd/jev`). В песочнице открыть нельзя: там нет дисплея, проверяется только сборка.
- `make build`: бинарь `bin/jev`.
- `make wasm`: `web/main.wasm` и `web/wasm_exec.js` из `GOROOT`.
- `make serve`: статический сервер `web/` на **http://localhost:8090** (флаг `-addr`). Перед ним нужен `make wasm`.
- `make e2e`: Playwright на WASM-сборке; сервер поднимается сам.
- Обновить визуальные снимки: `cd e2e && pnpm exec playwright test --update-snapshots`.
- `make generate` копирует `../shared/` в `internal/assets/shared/`; `make check-assets` проверяет, что копия не устарела.

## Параметры

Браузер: `?t=7.6&seed=1&paused=1&case=5&stage=gate&fx=0`.
Десктоп: `go run ./cmd/jev -t 7.6 -seed 1 -paused -case 5 -stage gate -fx=false`.

Порядок применения: `t`, затем `case` (начало кейса), затем `stage` (внутри кейса).

| Параметр | Значение | По умолчанию |
|---|---|---|
| `t` | время в секундах, ≥ 0 | 0 |
| `seed` | целое без знака | 1 |
| `paused` | `true` / `false` | `false` |
| `case` | 1..12 | 1 |
| `stage` | `state`, `ask`, `jev`, `gate`, `code` или 1..5 | по `t` |
| `fx` | `true` / `false` | `true` |

## Управление

- `Space`: пауза.
- `←` / `→`: предыдущий / следующий кейс.
- `F`: пост-эффекты вкл/выкл.
- Клик по плитке use case: переход к кейсу. Клик по кнопке этапа: переход к этапу текущего кейса.

## Структура

- `cmd/jev/`: вход для десктопа и WASM (`platform_desktop.go`, `platform_js.go` с `window.__jev`).
- `cmd/serve/`: статический сервер для `web/`.
- `internal/sim/`: чистая логика (таймлайн, KPI, PRNG, паритет с `shared/test-vectors.json`).
- `internal/params/`: разбор флагов и параметров URL.
- `internal/assets/`: встроенные копии `shared/` (`go:embed`), загрузчики, проверка дрейфа.
- `internal/scene/`: `camera` (стадии, плавный переход, покачивание) и `math` (mat4, Безье, проекция).
- `internal/ui/`: вся отрисовка: сцена (`scene*.go`), панели, шапка, кейсы, клики.
- `internal/fx/`: Kage-шейдеры `threshold`, `blur` и `vignette` (с зерном).
- `web/`: `index.html`, загрузчик WASM.
- `e2e/`: Playwright. `frames.spec.ts`: кадры F1–F4 и детерминизм паузы. `interaction.spec.ts`: клики, клавиши и автопроигрывание.

## Статус

M1–M5 готовы: симуляция с паритетом, статичная вёрстка, сцена (карточки, колонки, камера, связи, активный путь), частицы и пост-эффекты, интерактив, автопроигрывание, e2e и визуальные baseline F1–F4.

## Известные ограничения

- DOF приближённый: карточки дальше 3 единиц от глубины фокуса уходят в слой, размытый на половинном размере. Круга рассеяния нет, активная карточка всегда резкая.
- FPS не измерялся. В песочнице нет GPU, рендер идёт через SwiftShader: кадр занимает около секунды, часы идут примерно 5 тиков в секунду. Поэтому e2e проверяет статичные кадры и логику, а бюджет 3 с для автопроигрывания на реальной частоте не проверен: в e2e ожидание 20 с.
- Окно десктопа не открывалось (нет дисплея).
- Визуальные baseline привязаны к окружению (Chromium + SwiftShader на linux). При смене окружения их нужно пересоздать.
