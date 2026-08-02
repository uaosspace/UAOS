# UAOS — ГС «УАПБ»

Офіційний сайт громадської спілки **«Українська Асоціація Професійної Безпеки»** (UAOS).

Корпоративний лендинг з каталогом учасників, подіями, новинами, документами, формою вступу.  
Контент керується через **Sanity CMS**.

**Репозиторій:** [github.com/uaosspace/UAOS](https://github.com/uaosspace/UAOS)

---

## Архітектура

```
Sanity Studio (адмінка)  →  Content Lake  →  Сайт (Vite/React на Vercel)
Заявка на вступ          →  POST /api/join →  Sanity (+ опційно Formspree)
```

Поки `VITE_SANITY_PROJECT_ID` не заданий — сайт показує локальні seed-дані.

Детальний чекліст акаунтів: [docs/SANITY_SETUP.md](docs/SANITY_SETUP.md)

---

## Стек

| | |
|---|---|
| UI | React 19 + TypeScript + Vite 6 |
| Стилі | Tailwind CSS v4 |
| CMS | Sanity Studio 3 (`studio/`) |
| Хостинг сайту | Vercel |
| Іконки / дати | lucide-react, luxon |

---

## Запуск сайту

```bash
npm install
cp .env.example .env.local   # встав Project ID після створення Sanity
npm run dev
```

Сайт: http://localhost:3000

```bash
npm run build
npm run lint
```

### Env (сайт)

| Змінна | Де | Призначення |
|---|---|---|
| `VITE_SANITY_PROJECT_ID` | `.env.local` + Vercel | ID проєкту Sanity |
| `VITE_SANITY_DATASET` | те саме | зазвичай `production` |
| `VITE_SANITY_STUDIO_URL` | те саме | посилання на Studio |
| `SANITY_API_WRITE_TOKEN` | **тільки Vercel** (secret) | запис заявок через `/api/join` |
| `FORMSPREE_JOIN_ENDPOINT` | опційно | дубль заявки на email |

---

## Sanity Studio

```bash
npm run studio:install
cp studio/.env.example studio/.env   # той самий Project ID
npm run studio                       # http://localhost:3333
```

Деплой Studio на Sanity Hosting:

```bash
npm run studio:deploy
```

Після деплою онови `VITE_SANITY_STUDIO_URL` (напр. `https://uaos.sanity.studio`).

Seed демо-подій (потрібен write token):

```bash
node --env-file=.env.local scripts/seed-events.mjs
```

У Studio також заведи singleton **Site settings**, документи, учасників, новини.

---

## Адмін на сайті (`#/admin`)

Спрощений хаб: кнопка «Відкрити Sanity Studio» + локальний fallback-список заявок.  
Логін демо: `admin` / `admin123` (змінити перед продакшеном).

---

## Vercel

1. Import репо [github.com/uaosspace/UAOS](https://github.com/uaosspace/UAOS)  
2. Framework: Vite  
3. Env: `VITE_SANITY_*` + `SANITY_API_WRITE_TOKEN`  
4. Production branch: `main`  
5. Preview-гілки для правок UI; контент — drafts у Studio

API route: [`api/join.ts`](api/join.ts)

---

## Структура

```
src/                 # лендинг
  lib/sanity.ts      # клієнт Sanity
  data/              # fetch* + seed fallbacks
  components/
studio/              # Sanity Studio + schemaTypes
api/join.ts          # serverless заявки
docs/SANITY_SETUP.md
```

---

## Ліцензія

Код і контент — для ГС «УАПБ» / UAOS.
