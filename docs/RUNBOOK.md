# UAOS runbook — Neon + admin + Blob

## Local full stack (admin + API)

1. Ensure `.env.local` is complete (see `.env.example`).
2. Sync into Vercel **Development** (forces `SITE_URL=http://localhost:3000`):
   ```bash
   npm run dev:sync-env
   ```
3. Run UI + serverless:
   ```bash
   npm run dev:stack
   ```
4. Open `http://localhost:3000/admin`.

`npm run dev` alone serves the SPA only — `/api/admin/*` will 404.

## Database restore

1. Create/restore Neon branch or restore from Neon backup UI.
2. Set `DATABASE_URL` (pooled) in Vercel server env.
3. Apply migrations:
   ```bash
   npm run db:migrate
   ```
4. Optional reseed public content (dev/staging only):
   ```bash
   npm run db:seed
   ```
5. Recreate admin if needed:
   ```bash
   npm run admin:create -- --email=you@example.com --password='…' --role=admin
   ```

## Blob / media

- Public assets live under Blob path `public/…` and are referenced by URL in content tables.
- Private assets live under `private/…` (`access: 'private'`). Download only via authenticated `GET /api/admin/files/:id`.
- If Blob store is lost, restore from Vercel Blob backup or re-upload; `media_assets` rows must match storage keys.

## Offboarding an admin

1. Set `admin_users.active = false` (or delete user).
2. `DELETE FROM admin_sessions WHERE user_id = …` (or call revoke-all while still logged in).
3. Rotate `SESSION_SECRET` only if session theft is suspected (invalidates all sessions).
4. Revoke personal tokens in Vercel/Neon/Brevo/Cloudflare as needed.

## Suspected compromise

1. Revoke all `admin_sessions`.
2. Rotate `SESSION_SECRET`, `MFA_ENC_KEY`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, Brevo, Turnstile secrets.
3. Force MFA re-enrollment for PII roles.
4. Preserve `audit_events`; do not paste application PII into tickets/chat.

## Join form outage

- Without `DATABASE_URL`, `/api/join` returns **503** (no silent success).
- Rate limit and Turnstile failures return **429** / **400**.
- Brevo notify is best-effort after successful DB write; mail failure must not roll back the application.
