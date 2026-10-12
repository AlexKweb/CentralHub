# JEV / Decision Pipeline: React

Вариант 1 дашборда «JEV / Decision Pipeline»: **Vite + TypeScript (strict) + React 19**, 3D-сцена на **React Three Fiber**, DOM-интерфейс поверх canvas. Спецификация: [SPEC.md](../SPEC.md).

Дашборд показывает 12 кейсов по 8 с каждый (STATE → ASK → JEV → GATE → CODE): колонки карточек, связи и частицы, активный путь кейса, пост-эффекты (bloom, DOF, виньетка, зерно), KPI и нижние панели. Внешних сетевых запросов нет.

## Стек

| Пакет | Версия |
|---|---|
| React / react-dom | 19.3.0 |
| three | 0.186.1 |
| @react-three/fiber | 9.8.1 |
| @react-three/drei | 10.7.9 |
| @react-three/postprocessing / postprocessing | 3.2.0 / 6.39.5 |
| zustand | 5.0.15 |
| Vite | 8.3.4 |
| TypeScript | 7.0.2 |
| Vitest | 5.0.3 |
| @playwright/test | 1.64.0 |

Версии зафиксированы в `pnpm-lock.yaml` (pnpm 10.31.0).

## Установка и команды

```sh
cd react
pnpm i                        # pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # один раз, для e2e
pnpm dev                      # Vite: http://localhost:5173
pnpm test                     # Vitest: unit-тесты sim, сцены и UI
pnpm e2e                      # Playwright: собирает приложение и поднимает preview на :4173
pnpm e2e --update-snapshots   # перегенерировать baseline кадров F1–F4
pnpm build                    # tsc -b && vite build
pnpm typecheck                # tsc -b
```

## Параметры URL

| Параметр | Значение |
|---|---|
| `t` | время в секундах, цикл 96 с (12 × 8 с), по умолчанию 0 |
| `seed` | целое, по умолчанию 1: раскладка связей, частицы, метрики |
| `paused=1` | пауза; кадр становится чистой функцией `t` |
| `case` | 1–12: переход к началу кейса (применяется поверх `t`) |
| `stage` | `state`, `ask`, `jev`, `gate`, `code` или 1–5 (поверх `t`) |
| `fx=0` | выключить пост-эффекты |

Пример кадра F1: `http://localhost:5173/?seed=1&paused=1&t=7.6`.

## Управление

- `Space` — пауза / продолжить;
- `←` / `→` — предыдущий / следующий кейс;
- `F` — пост-эффекты вкл / выкл;
- клик по плитке кейса — переход к кейсу; клик по кнопке STATE / ASK / JEV / GATE / CODE — переход к этапу текущего кейса.

## Структура

| Путь | Что внутри |
|---|---|
| `src/sim/` | чистая логика без DOM и React: таймлайн, KPI, панели, данные кейсов и карточек, PRNG mulberry32; паритет с `../shared/test-vectors.json` |
| `src/state/` | zustand-часы (`store.ts`), цикл `requestAnimationFrame`, клавиши, тестовый хук `window.__jev` |
| `src/ui/` | DOM-слой поверх сцены: шапка, KPI, заголовок кейса, панели, нижняя строка, `Frame` (кадр 1240×1568) |
| `src/scene/` | R3F-сцена: колонки и карточки (CanvasTexture), связи, частицы (шейдеры), активный путь, камера, пост-эффекты в `PostFx.tsx` |
| `e2e/` | Playwright: кадры F1–F4 с baseline в `frames.spec.ts-snapshots/`, интерактив, autoplay, детерминизм паузы, fx |

Данные из `../shared/` подключаются алиасом `@shared`. Снимки кадров для ревью пишутся в `e2e/report/` и в git не попадают.

## Статус

M1–M5 выполнены. Пауза даёт побайтно одинаковые кадры (проверяется e2e), интерактив и autoplay покрыты тестами, кадры F1–F4 сверяются с baseline (`maxDiffPixelRatio` 0.02).

## Известные ограничения

- Глубина резкости (DOF) аппроксимирована под SwiftShader; на реальном GPU картина будет отличаться.
- FPS в песочнице не измерялся: сцена с пост-эффектами в SwiftShader рендерится очень медленно (около 0.25 кадра в секунду), поэтому autoplay-тест идёт с `fx=0`, а часы привязаны ко времени кадров.
- Baseline кадров снят в песочнице SwiftShader (Linux). На другой платформе или GPU понадобится `pnpm e2e --update-snapshots`.
