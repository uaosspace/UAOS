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

## После деплоя

- [ ] `POST /api/join` пишет в Neon (не в Sanity)
- [ ] Вход в `/admin` + MFA работает
- [ ] Очередь заявок и статистика совпадают с БД
- [ ] Публичный контент отдаётся из `/api/public/*`
- [ ] Закрытые файлы не доступны публично в Blob
- [ ] Письмо Brevo не содержит email/телефон/текст сообщения
- [ ] Security-заголовки ответа на месте (HSTS, nosniff, CSP enforce)
- [ ] Offboarding: отключить admin-пользователя, отозвать сессии, ротировать секреты

## Базовые действия при инциденте

1. Отозвать сессии (`admin_sessions`) и ротировать `SESSION_SECRET`, если подозревается кража cookie.
2. При необходимости ротировать `DATABASE_URL` / Blob / Brevo / Turnstile ключи.
3. Сохранять `audit_events`; не выгружать полные PII заявок в чат/логи.
