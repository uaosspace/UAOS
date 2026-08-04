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
npm run dev
```

Локально публічний контент без запущеного API в DEV може показувати seed з попередженням у консолі.

## Скрипти

| Команда | Призначення |
|---------|-------------|
| `npm run dev` | Vite на :3000 |
| `npm run build` | Production build |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run db:migrate` | SQL міграції |
| `npm run db:seed` | Seed content tables |
| `npm run admin:create` | Створити/оновити admin user |

## Env (див. `.env.example`)

| Змінна | Де | Примітка |
|--------|-----|----------|
| `DATABASE_URL` | server only | Neon pooled |
| `SESSION_SECRET` | server | 32-byte hex |
| `MFA_ENC_KEY` | server | 32-byte hex |
| `BLOB_READ_WRITE_TOKEN` | server | Vercel Blob |
| `SITE_URL` | server | CSRF Origin |
| `VITE_TURNSTILE_SITE_KEY` | public | optional locally |
| `TURNSTILE_SECRET_KEY` | server | required in prod |
| `BREVO_API_KEY` / `NOTIFY_EMAIL_*` | server | optional notify |

## Документація

- `CODE_MAP.md` — архітектура
- `docs/OPS_CHECKLIST.md` — cutover / MFA / приймання
- `docs/RUNBOOK.md` — restore / offboarding / інциденти
- `docs/SANITY_SETUP.md` — stub (Sanity removed)

## Безпека

- Security headers + CSP enforce у `vercel.json`
- Join: Turnstile, distributed rate limit, dedupe, correlation id на 5xx
- Admin: scrypt passwords, HttpOnly sessions, TOTP MFA для PII-ролей, Origin CSRF, audit_events
- Private Blob файли лише через `GET /api/admin/files/:id`
