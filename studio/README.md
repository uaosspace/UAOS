# Sanity Studio — UAOS

## Локально

1. Скопируй `.env.example` → `.env` и вставь Project ID из [sanity.io/manage](https://www.sanity.io/manage)
2. Из корня репо:

```bash
npm run studio:install
npm run studio
```

Откроется http://localhost:3333

## Деплой Studio

```bash
npm run studio:deploy
```

Хост задан в `sanity.cli.ts` как `uaos` → обычно `https://uaos.sanity.studio`.  
После деплоя обнови `VITE_SANITY_STUDIO_URL` на сайте.

## Схемы

| Тип | Назначение |
|---|---|
| `event` | Події |
| `member` | Учасники |
| `news` | Новини |
| `associationDocument` | Документи / PDF |
| `siteSettings` | Контакти (singleton) |
| `joinRequest` | Заявки на вступ |
