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
| `api/public-router.ts` | Публичный контент (rewrite с `/api/public/*`) |
| `api/admin-router.ts` | Auth, заявки, контент, media (rewrite с `/api/admin/*`) |
| `api/public/[...route].ts` | Thin re-export `public-router` (не дублировать логику) |
| `api/admin/[...route].ts` | Thin re-export `admin-router` (не дублировать логику) |

## Слои

| Путь | Ответственность |
|------|-----------------|
| `src/pages/*`, `src/pages/admin/*` | Страницы и admin UI |
| `src/components/*` | UI-секции |
| `src/hooks/*` | Навигация, content resources, consent |
| `src/routes/appRoutes.ts` | Реєстр маршрутів, `matchRoutePath` (без мовного префіксу), `buildRoutePath(route, locale, slug?)` |
| `src/routes/localizedRouting.ts` | Мовний префікс у pathname: `splitLocaleFromPathname`, `buildLocalizedPath`, `buildHreflangAlternates` |
| `src/data/*` | Fetch/map в UI-модели; seed как DEV fallback |
| `src/data/translations/*` | UI-строки: публичные словари на 6 локалей, `admin.ts` — намеренно uk/en |
| `src/lib/contentApi.ts` | HTTP-клиент `/api/public` |
| `src/lib/contentGuards.ts` | Нормализация/guards; `readLocalizedText` читает все локали |
| `src/lib/joinRequests.ts` | Клиент join POST |
| `src/lib/privacyPolicy.ts` | Версія політики / мова повідомлення для consent trail |
| `src/lib/siteTerms.ts` | Версія умов використання / участі для consent trail |
| `src/lib/siteOrigin.ts` | Канонічний production-origin для статичних SEO-файлів |
| `src/lib/documentMeta.ts` | Canonical / absolute asset URL helpers для клієнтського SEO |
| `src/hooks/useDocumentMeta.ts` | Клієнтські title/description/canonical/OG/Twitter (після JS) |
| `public/robots.txt`, `public/sitemap.xml` | Crawler policy + статичний sitemap (маршрути × 6 локалей) |
| `src/components/TermsPage.tsx` | Сторінка /terms (шаблон до схвалення) |
| `src/lib/sanity.ts` | Stub (удалённый Sanity; бросает при вызове) |
| `api/_lib/db.ts` | Neon facade (префикс `_` — не Serverless Function на Vercel Hobby) |
| `api/_lib/applicationsRepo.ts` | Заявки |
| `api/_lib/rateLimitStore.ts` | Distributed rate limit |
| `api/_lib/turnstile.ts` | Bot check |
| `api/_lib/brevoNotify.ts` | Low-PII mail |
| `api/_lib/auth/*` | Password/session/MFA/policy |
| `api/_lib/contentRepo.ts` | CMS tables; локализованные поля в `*_i18n` JSONB + dual-write в legacy `*_uk`/`*_en` |
| `api/_lib/blobStore.ts` | Vercel Blob |
| `db/migrations/*` | SQL migrations |
| `scripts/migrate.mjs`, `seed-db.mjs`, `create-admin.mjs` | Ops scripts |
| `studio/` | Placeholder «removed» (не рабочий CMS) |

## Контракты

- `POST /api/join` JSON + ошибки HTTP (в т.ч. `noticeLanguage`: `uk`|`en`, `termsConsent`)
- `GET /api/public/{members,news,events,documents,site-settings}`
- ` /api/admin/*` session cookie + Origin на мутациях
- UI-модели `src/types/*`; `LocalizedText` — uk/en обязательны, de/es/kk/fr опциональны
- Переводы `src/data/translations/*`: публичные ключи полны для 6 локалей, `admin.ts` — uk/en
- Маршрути: зокрема `/privacy`, `/terms`
- URL — джерело істини для мови інтерфейсу: `uk` (default) без префіксу (`/`, `/members/slug`), решта 5 локалей — з префіксом (`/en/...`, `/de/...`, `/es/...`, `/kk/...`, `/fr/...`). Легасі uk-адреси без префіксу лишаються валідними. `localStorage.uaos_lang` — лише останнє переважання (persist для LanguageSwitcher і єдиний сигнал мови для `/admin`, де немає мовного префіксу); URL з явним префіксом або без нього ніколи не редиректиться мовчки через localStorage. `<link rel="alternate" hreflang>` (6 локалей + `x-default` → uk) генерується в рантаймі в `App.tsx` для кожного публічного маршруту (крім `/admin`).
- Локализованный контент в Neon: колонки `*_i18n` JSONB (`{uk,en,de,es,kk,fr}`); legacy `*_uk`/`*_en` сохраняются для совместимости
- Env: `DATABASE_URL`, `SESSION_SECRET`, `MFA_ENC_KEY`, `BLOB_READ_WRITE_TOKEN`, `TURNSTILE_*`, `BREVO_*`, `SITE_URL`; `PRIVACY_POLICY_VERSION` — опциональный override поверх `src/lib/privacyPolicy.ts`
- SEO (клієнтський шар, без SSR): `public/robots.txt`, `public/sitemap.xml` (origin = `PUBLIC_SITE_ORIGIN` / production `SITE_URL`), `useDocumentMeta` виставляє `canonical`, `og:*`, `twitter:*` після завантаження JS; `index.html` тримає uk-fallback meta для no-JS

## Инварианты

- Запись заявок только server-side после валидации и rate limit.
- Write-секреты БД/Blob/сессий не попадают в клиентский bundle.
- Версия політики на `/privacy` и штамп в `consents` для `membership_application` совпадают (`src/lib/privacyPolicy.ts`).
- Версия умов на `/terms` и штамп в `consents` для `membership_terms` совпадают (`src/lib/siteTerms.ts`).
- Analytics только после cookie consent.
- MFA обязателен для ролей с PII (`admin`, `applications`).
- Silent seed-fallback в production запрещён.
- Локализованный текст читается только через `resolveLocalized`, не прямым индексом по локали: незаполненная локаль обязана падать на английский, а не давать пустоту.
- Запись контента пишет и `*_i18n`, и legacy-колонки, пока legacy не удалены отдельной миграцией.
- `/privacy` и `/terms` существуют только на uk/en; остальные локали получают английский текст с явной пометкой об аутентичных версиях.
- Handler-логика `/api/admin/*` и `/api/public/*` живёт только в `api/admin-router.ts` и `api/public-router.ts`; catch-all `api/admin/[...route].ts` и `api/public/[...route].ts` — только re-export.
