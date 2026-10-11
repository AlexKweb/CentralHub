# JEV / Decision Pipeline: Go

Вариант 2: **Go + Ebitengine v2.10** (десктоп и WebAssembly). Спецификация: [SPEC.md](../SPEC.md) (§12, §13), контракт симуляции: [shared/SIM.md](../shared/SIM.md).

## Статус

**M1 — готово.** Пакет `internal/sim` повторяет `shared/tools/simref.py` и проходит все векторы `shared/test-vectors.json`. `internal/assets` встраивает копии `shared/` и проверяет их SHA-256. Рендеринга пока нет (M2 и далее).

## Команды

Все команды запускаются из папки `go/` (нужен Go ≥ 1.25).

- `make generate` — копирует `../shared/` в `internal/assets/shared/`. Запускать после любой правки `shared/`.
- `make test` — `go vet ./...` и `go test ./...`.
- `make check-assets` — завершается ошибкой, если копия устарела. Ничего не пишет.

`shared/` только для чтения: правки данных и контракта вносит оркестратор.

## Структура

- `internal/sim/` — чистая логика без Ebitengine. `parity_test.go` сверяет все разделы векторов, `behavior_test.go` проверяет граничные случаи.
- `internal/assets/` — `gen/` (копирование), `load.go` (загрузчики), `assets_test.go` (дрейф копий), `data_test.go` (JSON Schema и инварианты данных).
