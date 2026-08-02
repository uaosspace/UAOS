# UAOS Sanity accounts checklist

## Phase 0 (manual — once)

1. Create a project Google account (not personal gaming mail).
2. Sign in at https://www.sanity.io with that Google account.
3. Create project name: UAOS, dataset: production.
4. Copy Project ID into root `.env.local` and `studio/.env`.
5. Create an API token (Editor) for server writes → Vercel `SANITY_API_WRITE_TOKEN`.
6. Later: same Google → Vercel → import https://github.com/Lewa2424/UAOS

Until Project ID is set, the site uses local seed fallbacks for events/members/etc.

## Vercel (Phase 6)

Project Settings → Environment Variables:

| Variable | Notes |
|---|---|
| `VITE_SANITY_PROJECT_ID` | Public |
| `VITE_SANITY_DATASET` | `production` |
| `VITE_SANITY_STUDIO_URL` | e.g. `https://uaos.sanity.studio` after deploy |
| `SANITY_API_WRITE_TOKEN` | Secret — never `VITE_` |
| `FORMSPREE_JOIN_ENDPOINT` | Optional email forward |

Deploy Studio:

```bash
npm run studio:deploy
```

Seed demo events (optional):

```bash
node --env-file=.env.local scripts/seed-events.mjs
```
