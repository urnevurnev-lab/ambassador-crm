# Frontend — Ambassador CRM (Telegram Mini App)

React-приложение (Vite) для Telegram Mini Apps: mobile-first UI, safe-area, glassmorphism, `HashRouter`.

Полная документация и общий quick-start — в `README.md` в корне репозитория.

## Команды

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

Линтер:

```bash
npm run lint
```

## Dev-прокси API

В dev-режиме запросы на `/api/*` проксируются на `http://localhost:3000` (см. `vite.config.ts`).

## Навигация

Используется `HashRouter` (`/#/route`) — это удобно для хостинга внутри Telegram.

## UI заметки

- Глобальная оболочка: `src/components/Layout.tsx` (safe-area + фон + toaster + таббар).
- Визит: выбор активности в точке ведёт на `/visit?facilityId=ID&type=transit|checkup|tasting|b2b`.
- Иконки: `lucide-react`.
- Telegram SDK: `@twa-dev/sdk` (BackButton, HapticFeedback, ClosingConfirmation и т.д.).
