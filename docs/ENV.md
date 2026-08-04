# UAOS — где хранятся секреты (без значений)

Один локальный файл с секретами: **`.env.local`**.  
Шаблон без секретов: **`.env.example`**.  
Не создавать вторые «архивы» вроде `.env.vercel.*` — они дублируются, устаревают и легче утекают.

## Файлы

| Файл | Назначение |
|------|------------|
| `.env.local` | Рабочие секреты для локалки + источник для `npm run dev:sync-env` |
| `.env.example` | Список ключей без значений (в git) |
| `.vercel/.env.development.local` | Кэш CLI после `vercel pull` (в `.gitignore`) — не править руками |

## Vercel Environments

| Ключ | Development | Preview | Production |
|------|-------------|---------|------------|
| `SITE_URL` | `http://localhost:3000` | URL preview / сайт | канонический URL сайта |
| `DATABASE_URL` | Neon | Neon | Neon |
| `MFA_ENC_KEY` | тот же при общей БД | да | да |
| `SESSION_SECRET` | да | да | да |
| `PRIVACY_POLICY_VERSION` | да | да | да |
| `BLOB_READ_WRITE_TOKEN` | да | да | да |
| `BLOB_STORE_ID` | да | да | да |
| `BLOB_WEBHOOK_PUBLIC_KEY` | по необходимости | да | да |
| Turnstile pair | hostname `localhost` | preview host | prod host |
| Brevo trio | опционально | опционально | опционально |

Команды:

```bash
npm run dev:sync-env   # .env.local → Vercel Development
npm run dev:stack      # pull + UI + API
```

## Вне Vercel (источники истины для учёток)

| Ресурс | Что там |
|--------|---------|
| Neon | connection string → `DATABASE_URL` |
| Vercel Blob | token / store id / webhook key |
| Cloudflare Turnstile | site + secret; hostnames виджета |
| Brevo | API key + from/to для notify |
| Authenticator | TOTP на admin-пользователях (секрет в БД, шифр `MFA_ENC_KEY`) |

## Запрещено

- Коммитить `.env.local`, `.env.vercel.*`, дампы `vercel env pull` в корень репо
- Держать несколько копий одних и тех же секретов «на всякий случай» в разных именах файлов
- Класть production `SITE_URL` в локальный `.env.local` (ломает CSRF на localhost)
