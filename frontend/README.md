# Frontend — Ambassador CRM

Основная документация проекта теперь в корневом `README.md`.

Быстрые команды для фронтенда:
```bash
npm install
npm run dev
npm run build
npm run lint
```

Dev-прокси: `/api/*` → `http://localhost:3000` (см. `vite.config.ts`). При раздельных доменах задайте `VITE_API_BASE_URL`.
