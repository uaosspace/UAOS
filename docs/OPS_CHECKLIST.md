# UAOS — операционный чеклист (Neon + admin + Blob)

## Перед отказом от Sanity

1. Экспортировать датасет Sanity (архив хранить офлайн, не в git):
   ```bash
   cd studio
   npx sanity dataset export production ../docs/backups/sanity-production.tar.gz
   ```
2. Подтвердить MFA на: Vercel, GitHub, Neon, Brevo, Cloudflare (Turnstile), регистраторе домена.
3. Инвентаризация аккаунтов: один владелец организации + именованные админы; отозвать неиспользуемые API-токены.
4. Создать проект Neon в регионе **EU**; скопировать `DATABASE_URL` (pooled) только в server env Vercel.
5. Создать хранилище Vercel Blob; задать `BLOB_READ_WRITE_TOKEN` (только server).
6. Создать сайт Cloudflare Turnstile; задать `TURNSTILE_SECRET_KEY` (server) и `VITE_TURNSTILE_SITE_KEY` (public).
7. Сгенерировать секреты:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Использовать разные значения для `SESSION_SECRET` и `MFA_ENC_KEY`.

## Матрица env (Vercel)

Три среды — **Development** (локальный `vercel dev`), **Preview**, **Production**.  
Не путать: `npm run dev` (только Vite) ≠ `npm run dev:stack` (Vite + API).

| Переменная | Development | Preview | Production |
|------------|-------------|---------|------------|
| `SITE_URL` | `http://localhost:3000` | URL preview / канонический | канонический сайт |
| `DATABASE_URL` | да | да | да |
| `MFA_ENC_KEY` | да (тот же ключ при общей БД) | да | да |
| `SESSION_SECRET` | да | да | да |
| `PRIVACY_POLICY_VERSION` | да | да | да |
| `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID` | да | да | да |
| Turnstile pair | hostname `localhost` | preview host | prod host |
| Brevo trio | опционально | опционально | опционально |

После правки `.env.local`: `npm run dev:sync-env`, затем `npm run dev:stack`.

Локальные артефакты `vercel env pull` / `vercel pull` (`.env.vercel.*`, `.vercel/.env.*.local`) — **не коммитить**; удалять после проверки.

## После деплоя

- [ ] `POST /api/join` пишет в Neon (не в Sanity)
- [ ] Вход в `/admin` + MFA работает (prod и локально через `dev:stack`)
- [ ] Очередь заявок и статистика совпадают с БД
- [ ] Публичный контент отдаётся из `/api/public/*`
- [ ] Закрытые файлы не доступны публично в Blob
- [ ] Письмо Brevo не содержит email/телефон/текст сообщения (если Brevo настроен)
- [ ] Security-заголовки ответа на месте (HSTS, nosniff, CSP enforce)
- [ ] Offboarding: отключить admin-пользователя, отозвать сессии, ротировать секреты
- [ ] На Vercel заполнены Development / Preview / Production по матрице выше

## Базовые действия при инциденте

1. Отозвать сессии (`admin_sessions`) и ротировать `SESSION_SECRET`, если подозревается кража cookie.
2. При необходимости ротировать `DATABASE_URL` / Blob / Brevo / Turnstile ключи.
3. Сохранять `audit_events`; не выгружать полные PII заявок в чат/логи.
