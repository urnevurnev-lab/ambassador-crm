# Ambassador CRM — Telegram Mini App

Коммерческий CRM-интерфейс для амбассадоров и торговых представителей внутри Telegram Mini Apps. Фокус: точки, визиты (отчеты) и оформление заказов, плюс отдельная админ-панель для управления справочниками.

## Возможности

- Контроль доступа: приложение открывается только для пользователей, добавленных в CRM (по Telegram ID).
- Dashboard: KPI, статус маршрута/задач, сводка по заказам, быстрый переход в календарь команды.
- Точки (Work): поиск, список и создание новой точки, карточка точки с действиями.
- Визиты (wizard) с выбором активности:
  - `transit` (Проезд): чек‑ин → инвентарь → отчет → отправка
  - `checkup` (Открытая смена): смена (время/чашки) → отчет → отправка
  - `tasting` (Дегустация): участники → отчет → отправка
  - `b2b` (B2B): контакты/итоги → отчет → отправка
- Заказ (wizard): рекомендации (маст-лист) → каталог и корзина → контакт и выбор дистрибьютора → отправка.
- Знания: хаб “Знания” + экран “Обучение” (карточки/главы).
- Профиль: персональная статистика и быстрые переходы; вход в админку для роли `ADMIN`.
- Админ-панель: товары, цены, команда, подтверждение точек, визиты/отчеты (экспорт), заказы (экспорт), контент, дистрибьюторы.

## Навигация и маршруты

Нижний Tab Bar (основные разделы):
- `/` — Главная (Dashboard)
- `/work` — Точки (список и поиск)
- `/my-orders` — Заказы (раздел под историю/статусы)
- `/knowledge` — Знания
- `/profile` — Профиль

Глубокие экраны:
- `/facilities/:id` — карточка точки
- `/facilities/new` — создание точки
- `/visit` — визит (wizard). Можно стартовать сразу из точки: `/visit?facilityId=ID&type=transit|checkup|tasting|b2b`
- `/orders` — заказ (wizard)
- `/visits-history` — история визитов
- `/calendar` — календарь команды
- `/education` — обучение
- `/admin` — админ-панель (доступ через профиль при `role === ADMIN`)

Примечание: фронтенд использует `HashRouter`, поэтому при хостинге URL выглядит как `/#/work`.

## Архитектура репозитория

- `frontend/` — React (Vite) + Tailwind CSS + Framer Motion, Telegram Mini App SDK (`@twa-dev/sdk`)
- `backend/` — NestJS + Prisma, PostgreSQL, Telegram Bot интеграция, Excel-экспорт отчетов
- `docker-compose.yml` — Postgres (локально порт `5433`)

## Технологии

Frontend:
- React 19, Vite, TypeScript
- Tailwind CSS, Framer Motion
- `react-router-dom` (HashRouter)
- `lucide-react`, `react-hot-toast`
- `axios` + прокси `/api` на dev-сервере Vite
- Telegram Mini App SDK: `@twa-dev/sdk`

Backend:
- NestJS 10
- Prisma 5
- PostgreSQL 16 (Docker)
- `node-telegram-bot-api`, `exceljs`

## Быстрый старт (локально)

Требования:
- Node.js 18+ (рекомендуется 20+)
- Docker (для Postgres)

1) База данных:
```bash
docker-compose up -d
```

2) Backend (http://localhost:3000):
```bash
npm -C backend install
npm -C backend run start:dev
```

Если нужно применить схему Prisma:
```bash
cd backend
npx prisma db push
```

Опционально сиды:
```bash
npm -C backend run seed
# или точечно:
npm -C backend run seed:products
npm -C backend run seed:history
```

3) Frontend (http://localhost:5173):
```bash
npm -C frontend install
npm -C frontend run dev
```

Dev-прокси:
- Vite проксирует запросы `/api/*` на `http://localhost:3000` (см. `frontend/vite.config.ts`).

## Переменные окружения (backend)

Backend читает переменные из `backend/.env`. Для локальной разработки достаточно:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5433/ambassador_crm?schema=public"
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
```

Рекомендация: не коммитить реальные токены/пароли в репозиторий; используйте секреты окружения и ротацию ключей при утечке.

## Запуск в Telegram (Mini App)

1) Поднимите фронтенд и бэкенд локально.
2) Пробросьте `5173` наружу через tunnel (например, ngrok/serveo).
3) Укажите публичный URL WebApp в настройках бота (BotFather) и откройте Mini App.

## Скрипты

Frontend (`frontend/package.json`):
- `npm -C frontend run dev`
- `npm -C frontend run build`
- `npm -C frontend run preview`
- `npm -C frontend run lint`

Backend (`backend/package.json`):
- `npm -C backend run start:dev`
- `npm -C backend run build`
- `npm -C backend run start:prod`
- `npm -C backend run seed` / `seed:products` / `seed:history`

## Безопасность и ограничения

- Telegram Mini App данные (initData) должны валидироваться на бэкенде для защиты API.
- Админ-функции должны быть доступны только роли `ADMIN` (не через “скрытые” роуты).
- Не храните секреты в репозитории. Используйте `.env` локально и секреты окружения в деплое.
