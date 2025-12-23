# Ambassador CRM — Telegram Mini App

Коммерческое мобильное приложение (React + NestJS) внутри Telegram Mini Apps. Основные блоки: точки/визиты, заказы, пробники, база знаний и админ-панель. Фронт — Vite + Tailwind (glassmorphism), роутинг через `HashRouter` для Mini App. Бэк — NestJS + Prisma + PostgreSQL, интеграция с Telegram Bot и Excel-экспортами.

## Ключевые возможности
- Доступ по Telegram ID (только пользователи из CRM). Логин-сплэш + LockScreen для админки.
- Главная: KPI, маршрут/задачи, сводка заказов, переход в календарь команды.
- Точки: список/поиск/создание, карточка точки с активностями, текущими остатками и must-листом.
- Визиты (wizard с типами):
  - `transit` (Проезд): чек-ин → инвентарь → отчет.
  - `checkup` (Открытая смена): смена (время/чашки) → отчет.
  - `tasting` (Дегустация): участники → отчет.
  - `b2b` (B2B): контакты/итоги → отчет.
  Отчеты сохраняют наличие ароматов и расход пробников (если отмечены в шаге «что курили»).
- Заказ (wizard): must-лист рекомендаций → каталог и корзина → контакт + выбор дистрибьютора → отправка (сообщение в чат).
- Знания/Обучение: экран “Быстрый курс” + разделы базы знаний, которые наполняются из админки (CRUD разделов).
- ABC-анализ: рейтинг ароматов по встречаемости доступен из профиля (“ABC-анализ”, ведет на `/knowledge/rating`).
- Пробники: заказ через профиль, учет баланса (заказано/списано из активностей), “Мои данные” (СДЭК/телефон).
- Профиль: персональная статистика, баланс пробников, быстрые переходы, вход в админку для роли `ADMIN`.
- Админ-панель: товары, цены, команда (привязка до 7 чатов к сотруднику), объекты (подтверждение точек), визиты/заказы/пробники (экспорт с датовыми фильтрами), контент (CRUD), дистрибьюторы.

## Структура репозитория
- `frontend/` — React 19, Vite, TypeScript, Tailwind, Framer Motion, `@twa-dev/sdk`, `react-router-dom` (`HashRouter`), `axios`, `lucide-react`, `react-hot-toast`.
- `backend/` — NestJS 10, Prisma 5, PostgreSQL 16, `node-telegram-bot-api`, `exceljs`.
- `docker-compose.yml` — локальная БД Postgres (порт 5433).

## Быстрый старт (локально)
Требования: Node.js 18+ (рекомендуется 20+), Docker (для Postgres).

1) База данных
```bash
docker-compose up -d
```

2) Backend (http://localhost:3000)
```bash
npm -C backend install
npm -C backend run start:dev
```
Если нужно применить схему Prisma:
```bash
cd backend
npx prisma db push
```
Опциональные сиды:
```bash
npm -C backend run seed
# или точечно:
npm -C backend run seed:products
npm -C backend run seed:history
```

3) Frontend (http://localhost:5173)
```bash
npm -C frontend install
npm -C frontend run dev
```
Dev-прокси: Vite проксирует `/api/*` на `http://localhost:3000` (см. `frontend/vite.config.ts`).

## Переменные окружения
Backend (`backend/.env`):
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5433/ambassador_crm?schema=public"
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
TELEGRAM_MANAGER_CHAT_ID="OPTIONAL_TELEGRAM_CHAT_ID_FOR_NOTIFICATIONS"
```

Frontend (`frontend/.env`, опционально при раздельных доменах):
```env
VITE_API_BASE_URL="https://your-api.example.com"
```

## Маршруты (основные)
Tab bar: `/` (Dashboard), `/work` (Точки), `/my-orders`, `/knowledge`, `/profile`.

Глубокие:
- `/facilities/:id` — карточка точки.
- `/facilities/new` — создание точки.
- `/visit?facilityId=ID&type=transit|checkup|tasting|b2b` — визит.
- `/orders` — заказ (wizard).
- `/visits-history` — история визитов.
- `/calendar` — календарь команды.
- `/education` — обучение.
- `/knowledge/rating` — рейтинг/ABC-анализ.
- `/profile/data` — “Мои данные”.
- `/admin` — админ-панель (только `ADMIN`).

Примечание: используется `HashRouter`, поэтому URL внутри Mini App вида `/#/route`.

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

## Траблшутинг
- Белый экран: проверьте, что backend поднят и отвечает; при разных доменах задайте `VITE_API_BASE_URL`.
- Telegram Mini App: убедитесь, что `TELEGRAM_BOT_TOKEN` корректен и валидируется initData.
- Prisma: при ошибках схемы — убедитесь, что `backend/prisma/schema.prisma` на месте и выполнен `npx prisma db push`.

## Безопасность
- Валидируйте initData Telegram на backend.
- Роль `ADMIN` обязательна для входа в админку; не полагайтесь на скрытые маршруты.
- Не храните токены/пароли в репозитории — используйте `.env` локально и секреты окружения на проде.
