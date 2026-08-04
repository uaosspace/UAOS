# CODE_MAP — UAOS

Публичный сайт ГС «Українська Асоціація Професійної Безпеки» (UAOS): каталог участников, направления деятельности, новости и события, база знаний (документы/материалы), форма вступления, защищённая админка заявок и контента.

Источник истины по данным: **Neon Postgres**. Медиабайты: **Vercel Blob**. Уведомления о заявках: **Brevo** (low-PII). Sanity удалён.

## Основные потоки

### Публичный сайт

`src/main.tsx` → `src/App.tsx` → `Header` / page-маршрут / `Footer` → `src/pages/*` → секции `src/components/*` → hooks (`useAppNavigation`, content resources, cookie/theme) → `src/data/*` → `src/lib/contentApi.ts` → `GET /api/public/*` → Neon.

В DEV при недоступности API допустим fallback на локальный seed с `console.warn`. В production ошибка API пробрасывается в UI (`useContentResource.error`).

### Заявка на вступление

UI (`JoinPage` → `JoinApplicationForm`) → `src/lib/joinRequests.ts` → `POST /api/join` → валидация + Turnstile + distributed rate limit → Neon (`applications`, `consents`) → best-effort Brevo notify без email/телефона/текста сообщения.

### Админка

Маршрут SPA `/admin` → `src/pages/admin/AdminApp.tsx` (+ `ContentEditors.tsx`) → ` /api/admin/*` (session cookie HttpOnly, CSRF Origin, роли deny-by-default, MFA для PII-ролей) → Neon (+ Blob upload).

## Точки входа

| Файл | Роль |
|------|------|
| `src/main.tsx` | Client bootstrap |
| `src/App.tsx` | Theme/lang/routing shell; `/admin` без публичного chrome |
| `api/join.ts` | Join endpoint |
| `api/public/[...route].ts` | Публичный контент |
| `api/admin/[...route].ts` | Auth, заявки, контент, media |

## Слои

| Путь | Ответственность |
|------|-----------------|
| `src/pages/*`, `src/pages/admin/*` | Страницы и admin UI |
| `src/components/*` | UI-секции |
| `src/hooks/*` | Навигация, content resources, consent |
| `src/data/*` | Fetch/map в UI-модели; seed как DEV fallback |
| `src/lib/contentApi.ts` | HTTP-клиент `/api/public` |
| `src/lib/contentGuards.ts` | Нормализация/guards |
| `src/lib/joinRequests.ts` | Клиент join POST |
| `src/lib/sanity.ts` | Stub (удалённый Sanity; бросает при вызове) |
| `api/lib/db.ts` | Neon facade |
| `api/lib/applicationsRepo.ts` | Заявки |
| `api/lib/rateLimitStore.ts` | Distributed rate limit |
| `api/lib/turnstile.ts` | Bot check |
| `api/lib/brevoNotify.ts` | Low-PII mail |
| `api/lib/auth/*` | Password/session/MFA/policy |
| `api/lib/contentRepo.ts` | CMS tables |
| `api/lib/blobStore.ts` | Vercel Blob |
| `db/migrations/*` | SQL migrations |
| `scripts/migrate.mjs`, `seed-db.mjs`, `create-admin.mjs` | Ops scripts |
| `studio/` | Placeholder «removed» (не рабочий CMS) |

## Контракты

- `POST /api/join` JSON + ошибки HTTP
- `GET /api/public/{members,news,events,documents,site-settings}`
- ` /api/admin/*` session cookie + Origin на мутациях
- UI-модели `src/types/*`
- Переводы `src/data/translations/*`
- Env: `DATABASE_URL`, `SESSION_SECRET`, `MFA_ENC_KEY`, `BLOB_READ_WRITE_TOKEN`, `TURNSTILE_*`, `BREVO_*`, `SITE_URL`, `PRIVACY_POLICY_VERSION`

## Инварианты

- Запись заявок только server-side после валидации и rate limit.
- Write-секреты БД/Blob/сессий не попадают в клиентский bundle.
- Analytics только после cookie consent.
- MFA обязателен для ролей с PII (`admin`, `applications`).
- Silent seed-fallback в production запрещён.
