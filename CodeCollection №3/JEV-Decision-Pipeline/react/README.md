# JEV / Decision Pipeline: React

Вариант 1: **Vite + TypeScript (strict) + React 19**. Сцена на React Three Fiber подключится на вехе M3.

Статус: **M1** — скаффолд, чистая симуляция `src/sim/` с паритетом к `../shared/test-vectors.json`, тесты данных.
Интерфейс-заглушка выводит только заголовок. Спецификация: [SPEC.md](../SPEC.md).

## Установка и запуск

```sh
cd react
pnpm install --frozen-lockfile
pnpm dev          # дев-сервер Vite
pnpm typecheck    # tsc -b
pnpm test         # vitest run
pnpm build        # tsc -b && vite build
```

## Структура

| Путь | Что внутри |
|------|------------|
| `src/sim/` | чистая логика симуляции (без DOM и React), контракт в [../shared/SIM.md](../shared/SIM.md) |
| `src/sim/*.test.ts` | паритет со всеми секциями `test-vectors.json`, схемы и инварианты данных, поведение |
| `src/App.tsx`, `src/main.tsx` | заглушка M1 |

Данные из `../shared/` подключаются алиасом `@shared` (Vite и Vitest), `server.fs.allow` открывает родительскую папку.
