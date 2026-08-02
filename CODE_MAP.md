# Карта кода

Публичный сайт ГС «Українська Асоціація Професійної Безпеки» с каталогом участников, событиями, новостями, документами и формой вступления. Контент загружается из Sanity CMS, а при отсутствии конфигурации часть разделов использует локальные seed-данные.

## Архитектурный поток

Коротко: `src/main.tsx` → `src/App.tsx` → UI-секции и маршруты страницы → hooks координации (`src/hooks/*`) → data adapters (`src/data/*`) → Sanity client / serverless API (`src/lib/sanity.ts`, `api/join.ts`) → Sanity Content Lake или fallback seed.

## Директории и файлы

### `src/`

Главный фронтенд сайта на React + TypeScript.

| Путь | Назначение |

| `src/main.tsx` | Точка входа React-приложения, монтирует `App` и подключает глобальные стили. |
| `src/App.tsx` | Собирает shell приложения и переключает page-level контейнеры, модалку событий и footer. |
| `src/index.css` | Источник дизайн-токенов Tailwind v4 и общих glass/grid utility-классов проекта. |
| `src/types.ts` | Barrel-экспорт доменных типов для обратной совместимости старых импортов. |

### `src/hooks/`

Координационные хуки верхнего уровня.

| Путь | Назначение |

| `src/hooks/useAppNavigation.ts` | Синхронизирует hash/query-навигацию сайта и состояние модалки событий. |
| `src/hooks/useCookieConsent.ts` | Управляет согласием на cookie и синхронизирует его с localStorage. |
| `src/hooks/useSiteContent.ts` | Оркестрирует zone-based loading и не тянет все коллекции для каждого экрана. |

### `src/hooks/content/`

Низкоуровневые hooks загрузки по отдельным ресурсам.

| Путь | Назначение |

| `src/hooks/content/useContentResource.ts` | Универсальный hook ленивой загрузки одного ресурса с `enabled`-флагом. |
| `src/hooks/content/useSiteSettingsResource.ts` | Загружает singleton-настройки сайта. |
| `src/hooks/content/useMembersResource.ts` | Загружает список участников только для нужных экранов. |
| `src/hooks/content/useEventsResource.ts` | Загружает события только для домашней страницы и календаря. |
| `src/hooks/content/useDocumentsResource.ts` | Загружает документы только для раздела материалов. |
| `src/hooks/content/useNewsResource.ts` | Загружает новости отдельно от других контентных коллекций. |

### `src/components/`

Публичные секции лендинга и профиль участника.

| Путь | Назначение |

| `src/components/Header.tsx` | Верхняя навигация сайта, переключатели языка и темы, переходы по разделам. |
| `src/components/HeroSection.tsx` | Первый экран сайта и вызовы к разделу вступления и событиям. |
| `src/components/MissionBenefitsSection.tsx` | Блок миссии, практической ценности и преимуществ ассоциации. |
| `src/components/DirectionsSection.tsx` | Направления работы и цели ассоциации. |
| `src/components/FoundersSection.tsx` | Блок учредителей и структуры управления с заглушками для части контента. |
| `src/components/MembersCarousel.tsx` | Карусель участников и точка входа в профиль участника. |
| `src/components/MemberProfile.tsx` | Развёрнутый публичный профиль конкретного участника. |
| `src/components/NewsSection.tsx` | Лента новостей из Sanity, скрывается при пустом наборе. |
| `src/components/DocumentsSection.tsx` | Каталог документов с поиском и открытием файлов по `fileUrl`. |
| `src/components/JoinSection.tsx` | Форма вступления с валидацией и отправкой через `/api/join`. |
| `src/components/PrivacyPage.tsx` | Статическая страница политики конфиденциальности и GDPR-пояснений. |
| `src/components/Footer.tsx` | Контакты, быстрые ссылки и сброс cookie consent. |
| `src/components/CookieBanner.tsx` | Баннер согласия на cookie с вариантами accept / necessary only. |
| `src/components/AnalyticsGate.tsx` | Подключает `@vercel/analytics` только после согласия пользователя. |
| `src/components/AdminPanel.tsx` | Отключённый публичный admin-hub, ведущий редакторов в Sanity Studio. |

### `src/components/events/`

Изолированная UI-зона событий и календарных действий.

| Путь | Назначение |

| `src/components/events/UpcomingEventsPanel.tsx` | Компактный блок ближайших событий для hero-секции. |
| `src/components/events/EventCard.tsx` | Краткая карточка события в списках и ленте. |
| `src/components/events/EventDetails.tsx` | Подробный просмотр выбранного события и CTA-действия. |
| `src/components/events/EventsCalendarModal.tsx` | Модальное окно со вкладками upcoming/calendar/archive и выбором события. |
| `src/components/events/SaveEventMenu.tsx` | Меню сохранения/шеринга события в календари и соцсети. |

### `src/components/member-profile/`

Подкомпоненты страницы профиля участника.

| Путь | Назначение |

| `src/components/member-profile/ProfileHero.tsx` | Отрисовывает hero-обложку и брендовый блок профиля участника. |
| `src/components/member-profile/ProfileExtendedContent.tsx` | Показывает услуги, компетенции, товары, кейсы и сертификаты расширенного профиля. |
| `src/components/member-profile/ProfileLegalSection.tsx` | Показывает сворачиваемую юридическую секцию профиля. |
| `src/components/member-profile/ProfileContactCard.tsx` | Показывает публичные контакты участника и CTA перехода на его сайт. |

### `src/data/`

Адаптеры чтения контента и seed fallback.

| Путь | Назначение |

| `src/data/members.ts` | Загружает участников из Sanity, маппит их в UI-модель и даёт локальный seed fallback. |
| `src/data/events.ts` | Загружает события из Sanity и даёт локальный seed fallback для календаря. |
| `src/data/documents.ts` | Загружает документы из Sanity и даёт локальный seed fallback для публичного раздела. |
| `src/data/news.ts` | Загружает новости из Sanity без локального seed-аналога. |
| `src/data/siteSettings.ts` | Загружает контакты и брендовые настройки singleton-документа `siteSettings`. |
| `src/data/translations.ts` | Barrel-словарь UI-текстов, собираемый из нескольких тематических модулей. |
| `src/data/products.ts` | Нормализует embedded products участников в плоский read-model будущего каталога. |

### `src/data/translations/`

Разбитые по зонам UI словари переводов.

| Путь | Назначение |

| `src/data/translations/uiCore.ts` | Брендовые, навигационные и основные публичные тексты лендинга. |
| `src/data/translations/membership.ts` | Тексты вступления, профиля участника, privacy и базовой валидации форм. |
| `src/data/translations/operations.ts` | Тексты событий и административных сценариев. |

### `src/lib/`

Низкоуровневые адаптеры внешних систем и общие guards.

| Путь | Назначение |

| `src/lib/sanity.ts` | Создаёт Sanity client, строит image URLs и нормализует locale-поля. |
| `src/lib/cookieConsent.ts` | Хранит и читает решение пользователя по cookie consent. |
| `src/lib/joinRequests.ts` | Единый клиентский adapter отправки join-заявки в `/api/join`. |
| `src/lib/contentGuards.ts` | Набор guards и безопасных reader-функций для данных из CMS. |
| `src/lib/contentGuards.test.ts` | Узкие тесты guards и enum-like нормализации. |
| `src/lib/joinRequests.test.ts` | Узкие тесты клиентского adapter отправки join-заявки. |

### `src/utils/`

Вспомогательные функции, не завязанные на JSX.

| Путь | Назначение |

| `src/utils/eventDate.ts` | Форматирует даты событий, сортирует их и отделяет archive от upcoming. |
| `src/utils/calendarExport.ts` | Строит ссылки и действия для сохранения/шеринга событий. |

### `src/pages/`

Page-level контейнеры верхнего уровня.

| Путь | Назначение |

| `src/pages/HomePage.tsx` | Собирает домашнюю страницу из независимых секций. |
| `src/pages/MemberDetailsPage.tsx` | Отрисовывает страницу профиля выбранного участника. |
| `src/pages/PrivacyRoutePage.tsx` | Изолирует privacy page как самостоятельный маршрутный контейнер. |

### `src/routes/`

Константы и типы маршрутов верхнего уровня.

| Путь | Назначение |

| `src/routes/appRoutes.ts` | Хранит route constants и тип `AppRoute` для текущей навигации. |

### `src/types/`

Доменные типы, разнесённые по зонам ответственности.

| Путь | Назначение |

| `src/types/shared.ts` | Общие типы вроде `LocalizedText`. |
| `src/types/event.ts` | Модели событий и связанных enum-значений. |
| `src/types/member.ts` | Модели участников, их кейсов, сертификатов и embedded products. |
| `src/types/document.ts` | Модели публичных документов. |
| `src/types/forms.ts` | Модели заявок и контактных сообщений. |
| `src/types/commerce.ts` | Заготовки каталожных и платёжных доменных сущностей. |
| `src/types/index.ts` | Barrel-экспорт всех доменных типов. |

### `api/`

Serverless API для публичных форм.

| Путь | Назначение |

| `api/join.ts` | Принимает join-заявку, валидирует её, ограничивает спам и пишет в Sanity/Formspree. |

### `api/lib/`

Общие server-side helpers для форм и будущих commerce-сценариев.

| Путь | Назначение |

| `api/lib/http.ts` | Общие HTTP-проверки и формат JSON-ошибок для serverless endpoint-ов. |
| `api/lib/rateLimit.ts` | In-memory rate limiter для антиспама на уровне endpoint-а. |
| `api/lib/joinApplication.ts` | Нормализация, валидация и env-чтение для сценария join-заявки. |
| `api/lib/payments.ts` | Заготовки payment/order contracts и provider adapter boundary. |
| `api/lib/joinApplication.test.ts` | Тесты нормализации и валидации join-заявки. |

### `studio/`

Sanity Studio и её схема контента.

| Путь | Назначение |

| `studio/sanity.config.ts` | Конфигурация Sanity Studio. |
| `studio/sanity.cli.ts` | CLI-конфигурация Studio для локальной работы и deploy. |
| `studio/schemaTypes/index.ts` | Собирает все типы схем в единый список Studio. |
| `studio/schemaTypes/locale.ts` | Переиспользуемые локализованные поля `localeString` и `localeText`. |
| `studio/schemaTypes/member.ts` | Схема участника каталога и расширенного профиля. |
| `studio/schemaTypes/event.ts` | Схема события для календаря и карточек. |
| `studio/schemaTypes/news.ts` | Схема новости для публичной ленты. |
| `studio/schemaTypes/associationDocument.ts` | Схема документа/ссылки для раздела материалов. |
| `studio/schemaTypes/siteSettings.ts` | Singleton-настройки контактов и брендовых текстов сайта. |
| `studio/schemaTypes/joinRequest.ts` | Схема входящих заявок с consent trail и статусом обработки. |
| `studio/package.json` | Manifest Studio с командами запуска и deploy. |

### Корень репозитория

Конфигурация сборки и инфраструктуры.

| Путь | Назначение |

| `package.json` | Основной frontend manifest со скриптами dev/build/lint и зависимостями сайта. |
| `tsconfig.json` | Общая TypeScript-конфигурация frontend-части. |
| `vite.config.ts` | Конфигурация Vite для React-приложения. |
| `vercel.json` | Rewrites для serverless API на Vercel. |
| `README.md` | Документация по запуску, Sanity и деплою проекта. |
| `ALL_VISIBLE_RULES.txt` | Дамп правил v1.0 (утро 2026-08-02) для сравнения. |
| `ALL_VISIBLE_RULES_v2.0.txt` | Дамп правил v2.0 после добавления заполненных `.cursor/rules` 00–50. |
| `.cursor/rules/00-project-context.mdc` | Краткий always-on контекст UAOS: продукт, критические области, источники истины, границы. |
| `.cursor/rules/10-architecture-contracts.mdc` | Always-on архитектура: потоки, зависимости, контракты и инварианты. |
| `.cursor/rules/20-code-map.mdc` | Политика обновления `CODE_MAP.md` (`alwaysApply: false`). |
| `.cursor/rules/30-testing-quality.mdc` | Команды и стратегия проверок UAOS (`alwaysApply: false`). |
| `.cursor/rules/40-data-migrations.mdc` | Данные Sanity/seed/совместимость схем (`alwaysApply: false`). |
| `.cursor/rules/41-security.mdc` | Безопасность join, секретов, consent и внешнего ввода (`alwaysApply: false`). |
| `.cursor/rules/42-dependencies.mdc` | Правила изменения npm/Studio зависимостей (`alwaysApply: false`). |
| `.cursor/rules/50-project-conventions.mdc` | Стек, структура, стиль кода и локализация без дубля DS/security. |
| `.cursor/rules/uaos-design-system.mdc` | Детальная дизайн-система UAOS (`alwaysApply: false`, по UI-задачам). |
| `.cursor/rules/changed-files-sync.mdc` | Синхронизация изменённых путей в `docs/CHANGED_FILES.txt`. |
| `docs/CHANGED_FILES.txt` | Список путей для синка правок в AI Studio. |

## Оркестраторы

| Оркестратор | Координирует | Не должен выполнять |

| `src/App.tsx` | Сборку верхнеуровневых экранов и связывание UI с hooks навигации/контента | Прямой доступ к CMS, хранение сложной бизнес-логики форм, ручной разбор всех данных |
| `src/hooks/useAppNavigation.ts` | Hash/query-навигацию, профиль участника и модалку событий | Загрузку контента, рендер UI-секций, бизнес-правила CMS |
| `src/hooks/useSiteContent.ts` | Выбор нужных контентных ресурсов под конкретный верхнеуровневый экран | Детали UI-секций и прямое выполнение запросов в JSX |
| `api/join.ts` | Приём, валидацию и запись join-заявки в внешние системы | Рендер клиентского UI, хранение произвольного контента сайта |

## Точки входа

| Путь | Назначение |

| `src/main.tsx` | Стартует React-приложение в браузере. |
| `src/App.tsx` | Верхняя точка композиции всего публичного сайта. |
| `api/join.ts` | HTTP-вход для формы вступления. |
| `studio/sanity.config.ts` | Вход конфигурации для Sanity Studio. |

## Проверки

Сейчас проект опирается на `npm run lint` как на TypeScript type-check, `npm test` как на узкие unit-tests для guards/data/API-helpers и `npm run build` как на проверку production-сборки. Основной фокус автоматических проверок пока лежит на границах данных и server-side логике, а не на UI E2E.
