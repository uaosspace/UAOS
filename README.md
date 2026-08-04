# UAOS — публічний сайт асоціації

React 19 + Vite 6 SPA на Vercel. Дані: **Neon Postgres**. Медіа: **Vercel Blob**. Адмінка: маршрут `/admin`. Sanity CMS видалено.

```
Відвідувач  →  Vite SPA  →  /api/public/*  →  Neon
Заявка      →  POST /api/join → Neon (+ Brevo low-PII notify)
Редактор    →  /admin → /api/admin/* → Neon + Blob
```

## Швидкий старт

```bash
npm install
cp .env.example .env.local
# заповніть DATABASE_URL (і інші server secrets для API)
npm run db:migrate
npm run db:seed          # опційно, staging/dev
npm run admin:create -- --email=you@example.com --password='…' --role=admin
```

### UI only (без API)

```bash
npm run dev
```

Публічний контент без API в DEV може показувати seed з попередженням у консолі. Логін у `/admin` **не працюватиме** (немає `/api/admin`).

### Повний локальний стек (UI + API + адмінка)

`vercel dev` бере секрети з Vercel Environment **Development** (не з Preview/Production).

```bash
# один раз (або після зміни .env.local): синхронізувати Development на Vercel
npm run dev:sync-env

# щодня: pull Development + Vite + serverless на :3000
npm run dev:stack
```

Відкрийте `http://localhost:3000/admin`. `SITE_URL` у Development має бути `http://localhost:3000` (скрипт sync це форсує).

## Скрипти

| Команда | Призначення |
|---------|-------------|
| `npm run dev` | лише Vite на :3000 (без API) |
| `npm run dev:stack` | `vercel pull` + `vercel dev` (UI + API) |
| `npm run dev:sync-env` | `.env.local` → Vercel Development |
| `npm run build` | Production build |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run db:migrate` | SQL міграції |
| `npm run db:seed` | Seed content tables |
| `npm run admin:create` | Створити/оновити admin user |

## Env (див. `.env.example`)

| Змінна | Development | Preview / Production | Примітка |
|--------|-------------|----------------------|----------|
| `SITE_URL` | `http://localhost:3000` | публічний URL сайту | CSRF Origin |
| `DATABASE_URL` | той самий Neon (або гілка) | Neon | server only |
| `MFA_ENC_KEY` | **той самий**, якщо спільна БД | обовʼязково | інакше MFA не розшифрується |
| `SESSION_SECRET` | так | так | 32-byte hex |
| `BLOB_*` | так | так | Blob |
| `VITE_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | hostname `localhost` у віджеті | prod host | |
| `BREVO_API_KEY` / `NOTIFY_EMAIL_*` | опційно | опційно | notify після join |

## Документація

- `docs/ENV.md` — где какие секреты (без значений)
- `CODE_MAP.md` — архітектура
- `docs/OPS_CHECKLIST.md` — cutover / MFA / приймання
- `docs/RUNBOOK.md` — restore / offboarding / інциденти
- `docs/SANITY_SETUP.md` — stub (Sanity removed)

## Безпека

- Security headers + CSP enforce у `vercel.json`
- Join: Turnstile, distributed rate limit, dedupe, correlation id на 5xx
- Admin: scrypt passwords, HttpOnly sessions, TOTP MFA для PII-ролей, Origin CSRF, audit_events
- Private Blob файли лише через `GET /api/admin/files/:id`
