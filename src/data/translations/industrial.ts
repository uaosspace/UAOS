import type {Locale} from '../locales'

/**
 * Словник "industrial" — глобальні елементи (header/footer/hero/join-банер), що мають бути
 * повністю перекладені на всі 6 локалей. Бренд-копірайт виправлено з помилкового макета
 * "Асоціація виробників спецодягу" на реальний бренд UAOS = Українська Асоціація Професійної Безпеки.
 */
type IndustrialDictionary = {
  brand_line_primary: string
  brand_line_secondary: string
  nav_about: string
  nav_participants: string
  nav_news: string
  nav_contacts: string
  nav_join: string
  nav_admin: string
  lang_label: string
  lang_switch: string
  aria_home: string
  aria_main_nav: string
  aria_theme: string
  theme_dark: string
  theme_light: string
  theme_dark_title: string
  theme_light_title: string
  menu_open: string
  menu_close: string
  hero_title: string
  hero_lead: string
  hero_cta_join: string
  hero_cta_catalog: string
  hero_index: string
  hero_side_label: string
  stats_members_value: string
  stats_members_label: string
  stats_producers_value: string
  stats_producers_label: string
  stats_projects_value: string
  stats_projects_label: string
  stats_years_value: string
  stats_years_label: string
  stats_aria: string
  participants_kicker: string
  participants_title: string
  participants_link: string
  news_kicker: string
  news_title: string
  news_link: string
  news_read_more: string
  join_title_before: string
  join_title_underlit: string
  join_desc: string
  join_cta: string
  footer_desc: string
  footer_nav_title: string
  footer_activity_title: string
  footer_contacts_title: string
  footer_address: string
  footer_phone: string
  footer_email: string
  footer_activity_1: string
  footer_activity_2: string
  footer_activity_3: string
  footer_activity_4: string
  footer_copyright: string
  footer_privacy: string
  footer_terms: string
  social_linkedin: string
  social_facebook: string
  social_youtube: string
  social_telegram: string
  cookie_dialog: string
  cookie_title: string
  cookie_body: string
  cookie_privacy_link: string
  cookie_necessary: string
  cookie_accept: string
  page_not_found: string
  back_home: string
}

export const industrialTranslations: Record<Locale, IndustrialDictionary> = {
  uk: {
    brand_line_primary: 'Українська Асоціація',
    brand_line_secondary: 'Професійної Безпеки',
    nav_about: 'Про нас',
    nav_participants: 'Учасники',
    nav_news: 'Новини',
    nav_contacts: 'Контакти',
    nav_join: 'Стати учасником',
    nav_admin: 'Admin',
    lang_label: 'UA',
    lang_switch: 'Мова',
    aria_home: 'На головну',
    aria_main_nav: 'Головна навігація',
    aria_theme: 'Колірна тема',
    theme_dark: 'Увімкнути темну тему',
    theme_light: 'Увімкнути світлу тему',
    theme_dark_title: 'Темна тема',
    theme_light_title: 'Світла тема',
    menu_open: 'Відкрити меню',
    menu_close: 'Закрити меню',
    hero_title: 'Об’єднуємо професійну спільноту задля безпечної праці в Україні',
    hero_lead:
      'Виробники, постачальники, експерти та підприємства разом розвивають сучасні рішення, професійні стандарти й відповідальний ринок.',
    hero_cta_join: 'Стати учасником',
    hero_cta_catalog: 'Каталог учасників',
    hero_index: 'Безпека · стандарти · експертиза · партнерство',
    hero_side_label: 'Ukraine / professional safety',
    stats_members_value: '128',
    stats_members_label: 'Учасників Асоціації',
    stats_producers_value: '96',
    stats_producers_label: 'Виробників та постачальників',
    stats_projects_value: '320+',
    stats_projects_label: 'Реалізованих проєктів',
    stats_years_value: '12',
    stats_years_label: 'Років ефективної роботи',
    stats_aria: 'Показники асоціації',
    participants_kicker: 'Професійна мережа',
    participants_title: 'Учасники Асоціації',
    participants_link: 'Переглянути всіх учасників',
    news_kicker: 'Галузевий контекст',
    news_title: 'Новини та найближчі події',
    news_link: 'Всі новини',
    news_read_more: 'Читати далі',
    join_title_before: 'Долучайтеся до',
    join_title_underlit: 'професійної спільноти UAOS',
    join_desc: 'Приєднуйтесь до асоціації та розвивайте культуру безпеки праці в Україні разом з нами.',
    join_cta: 'Подати заявку',
    footer_desc:
      'Об’єднуємо виробників, постачальників та експертів для розвитку культури безпеки праці й підвищення стандартів якості в Україні.',
    footer_nav_title: 'Навігація',
    footer_activity_title: 'Діяльність',
    footer_contacts_title: 'Контакти',
    footer_address: '01001, м. Київ,\nвул. Хрещатик, 28',
    footer_phone: '+38 (044) 123-45-67',
    footer_email: 'info@uaos.org.ua',
    footer_activity_1: 'Представництво інтересів',
    footer_activity_2: 'Стандарти та якість',
    footer_activity_3: 'Експертиза та навчання',
    footer_activity_4: 'Партнерство',
    footer_copyright: 'Українська Асоціація Професійної Безпеки. Усі права захищено.',
    footer_privacy: 'Політика конфіденційності',
    footer_terms: 'Умови використання',
    social_linkedin: 'LinkedIn',
    social_facebook: 'Facebook',
    social_youtube: 'YouTube',
    social_telegram: 'Telegram',
    cookie_dialog: 'Згода на файли cookie',
    cookie_title: 'Файли cookie',
    cookie_body:
      'Ми використовуємо необхідні технічні cookie для роботи сайту. Аналітичні cookie — лише після вашої згоди. Деталі:',
    cookie_privacy_link: 'Політика конфіденційності',
    cookie_necessary: 'Лише необхідні',
    cookie_accept: 'Прийняти',
    page_not_found: 'Сторінку не знайдено',
    back_home: 'На головну',
  },
  en: {
    brand_line_primary: 'Ukrainian Association',
    brand_line_secondary: 'of Occupational Safety',
    nav_about: 'About',
    nav_participants: 'Members',
    nav_news: 'News',
    nav_contacts: 'Contacts',
    nav_join: 'Become a member',
    nav_admin: 'Admin',
    lang_label: 'EN',
    lang_switch: 'Language',
    aria_home: 'Home',
    aria_main_nav: 'Main navigation',
    aria_theme: 'Color theme',
    theme_dark: 'Enable dark theme',
    theme_light: 'Enable light theme',
    theme_dark_title: 'Dark theme',
    theme_light_title: 'Light theme',
    menu_open: 'Open menu',
    menu_close: 'Close menu',
    hero_title: 'Uniting the professional community for safe work in Ukraine',
    hero_lead:
      'Manufacturers, suppliers, experts and enterprises together develop modern solutions, professional standards and a responsible market.',
    hero_cta_join: 'Become a member',
    hero_cta_catalog: 'Member catalog',
    hero_index: 'Safety · standards · expertise · partnership',
    hero_side_label: 'Ukraine / professional safety',
    stats_members_value: '128',
    stats_members_label: 'Association members',
    stats_producers_value: '96',
    stats_producers_label: 'Producers and suppliers',
    stats_projects_value: '320+',
    stats_projects_label: 'Completed projects',
    stats_years_value: '12',
    stats_years_label: 'Years of effective work',
    stats_aria: 'Association metrics',
    participants_kicker: 'Professional network',
    participants_title: 'Association members',
    participants_link: 'View all members',
    news_kicker: 'Industry context',
    news_title: 'News and upcoming events',
    news_link: 'All news',
    news_read_more: 'Read more',
    join_title_before: 'Join the',
    join_title_underlit: 'UAOS professional community',
    join_desc: 'Become part of the association and help build a culture of occupational safety in Ukraine.',
    join_cta: 'Submit application',
    footer_desc:
      'We bring together manufacturers, suppliers, and experts to develop a culture of occupational safety and raise quality standards in Ukraine.',
    footer_nav_title: 'Navigation',
    footer_activity_title: 'Activities',
    footer_contacts_title: 'Contacts',
    footer_address: '01001, Kyiv,\n28 Khreshchatyk St.',
    footer_phone: '+38 (044) 123-45-67',
    footer_email: 'info@uaos.org.ua',
    footer_activity_1: 'Industry representation',
    footer_activity_2: 'Standards and quality',
    footer_activity_3: 'Expertise and training',
    footer_activity_4: 'Partnership',
    footer_copyright: 'Ukrainian Association of Occupational Safety. All rights reserved.',
    footer_privacy: 'Privacy policy',
    footer_terms: 'Terms of use',
    social_linkedin: 'LinkedIn',
    social_facebook: 'Facebook',
    social_youtube: 'YouTube',
    social_telegram: 'Telegram',
    cookie_dialog: 'Cookie consent',
    cookie_title: 'Cookies',
    cookie_body:
      'We use necessary technical cookies for site operation. Analytics cookies run only after your consent. Details:',
    cookie_privacy_link: 'Privacy Policy',
    cookie_necessary: 'Necessary only',
    cookie_accept: 'Accept',
    page_not_found: 'Page not found',
    back_home: 'Back to Home',
  },
  de: {
    brand_line_primary: 'Ukrainischer Verband',
    brand_line_secondary: 'für Arbeitssicherheit',
    nav_about: 'Über uns',
    nav_participants: 'Mitglieder',
    nav_news: 'Nachrichten',
    nav_contacts: 'Kontakt',
    nav_join: 'Mitglied werden',
    nav_admin: 'Admin',
    lang_label: 'DE',
    lang_switch: 'Sprache',
    aria_home: 'Zur Startseite',
    aria_main_nav: 'Hauptnavigation',
    aria_theme: 'Farbschema',
    theme_dark: 'Dunkles Design aktivieren',
    theme_light: 'Helles Design aktivieren',
    theme_dark_title: 'Dunkles Design',
    theme_light_title: 'Helles Design',
    menu_open: 'Menü öffnen',
    menu_close: 'Menü schließen',
    hero_title: 'Wir vereinen die Fachgemeinschaft für sichere Arbeit in der Ukraine',
    hero_lead:
      'Hersteller, Lieferanten, Experten und Unternehmen entwickeln gemeinsam moderne Lösungen, professionelle Standards und einen verantwortungsvollen Markt.',
    hero_cta_join: 'Mitglied werden',
    hero_cta_catalog: 'Mitgliederkatalog',
    hero_index: 'Sicherheit · Standards · Expertise · Partnerschaft',
    hero_side_label: 'Ukraine / professional safety',
    stats_members_value: '128',
    stats_members_label: 'Verbandsmitglieder',
    stats_producers_value: '96',
    stats_producers_label: 'Hersteller und Lieferanten',
    stats_projects_value: '320+',
    stats_projects_label: 'Umgesetzte Projekte',
    stats_years_value: '12',
    stats_years_label: 'Jahre wirksamer Arbeit',
    stats_aria: 'Kennzahlen des Verbands',
    participants_kicker: 'Professionelles Netzwerk',
    participants_title: 'Verbandsmitglieder',
    participants_link: 'Alle Mitglieder ansehen',
    news_kicker: 'Branchenkontext',
    news_title: 'Nachrichten und anstehende Events',
    news_link: 'Alle Nachrichten',
    news_read_more: 'Weiterlesen',
    join_title_before: 'Werden Sie Teil der',
    join_title_underlit: 'professionellen UAOS-Gemeinschaft',
    join_desc: 'Treten Sie dem Verband bei und gestalten Sie mit uns die Sicherheitskultur in der Ukraine.',
    join_cta: 'Antrag stellen',
    footer_desc:
      'Wir vereinen Hersteller, Lieferanten und Experten, um die Sicherheitskultur zu entwickeln und Qualitätsstandards in der Ukraine zu erhöhen.',
    footer_nav_title: 'Navigation',
    footer_activity_title: 'Tätigkeit',
    footer_contacts_title: 'Kontakt',
    footer_address: '01001, Kiew,\nChreschtschatyk-Str. 28',
    footer_phone: '+38 (044) 123-45-67',
    footer_email: 'info@uaos.org.ua',
    footer_activity_1: 'Interessenvertretung',
    footer_activity_2: 'Standards und Qualität',
    footer_activity_3: 'Expertise und Schulung',
    footer_activity_4: 'Partnerschaft',
    footer_copyright: 'Ukrainischer Verband für Arbeitssicherheit. Alle Rechte vorbehalten.',
    footer_privacy: 'Datenschutzrichtlinie',
    footer_terms: 'Nutzungsbedingungen',
    social_linkedin: 'LinkedIn',
    social_facebook: 'Facebook',
    social_youtube: 'YouTube',
    social_telegram: 'Telegram',
    cookie_dialog: 'Cookie-Zustimmung',
    cookie_title: 'Cookies',
    cookie_body:
      'Wir verwenden notwendige technische Cookies für den Betrieb der Website. Analyse-Cookies nur nach Ihrer Zustimmung. Details:',
    cookie_privacy_link: 'Datenschutzrichtlinie',
    cookie_necessary: 'Nur notwendige',
    cookie_accept: 'Akzeptieren',
    page_not_found: 'Seite nicht gefunden',
    back_home: 'Zur Startseite',
  },
  es: {
    brand_line_primary: 'Asociación Ucraniana',
    brand_line_secondary: 'de Seguridad Laboral',
    nav_about: 'Sobre nosotros',
    nav_participants: 'Miembros',
    nav_news: 'Noticias',
    nav_contacts: 'Contacto',
    nav_join: 'Convertirse en miembro',
    nav_admin: 'Admin',
    lang_label: 'ES',
    lang_switch: 'Idioma',
    aria_home: 'Ir al inicio',
    aria_main_nav: 'Navegación principal',
    aria_theme: 'Tema de color',
    theme_dark: 'Activar tema oscuro',
    theme_light: 'Activar tema claro',
    theme_dark_title: 'Tema oscuro',
    theme_light_title: 'Tema claro',
    menu_open: 'Abrir menú',
    menu_close: 'Cerrar menú',
    hero_title: 'Unimos a la comunidad profesional por un trabajo seguro en Ucrania',
    hero_lead:
      'Fabricantes, proveedores, expertos y empresas desarrollan juntos soluciones modernas, normas profesionales y un mercado responsable.',
    hero_cta_join: 'Convertirse en miembro',
    hero_cta_catalog: 'Catálogo de miembros',
    hero_index: 'Seguridad · normas · experiencia · colaboración',
    hero_side_label: 'Ukraine / professional safety',
    stats_members_value: '128',
    stats_members_label: 'Miembros de la Asociación',
    stats_producers_value: '96',
    stats_producers_label: 'Fabricantes y proveedores',
    stats_projects_value: '320+',
    stats_projects_label: 'Proyectos realizados',
    stats_years_value: '12',
    stats_years_label: 'Años de trabajo eficaz',
    stats_aria: 'Indicadores de la Asociación',
    participants_kicker: 'Red profesional',
    participants_title: 'Miembros de la Asociación',
    participants_link: 'Ver todos los miembros',
    news_kicker: 'Contexto sectorial',
    news_title: 'Noticias y próximos eventos',
    news_link: 'Todas las noticias',
    news_read_more: 'Leer más',
    join_title_before: 'Forme parte de la',
    join_title_underlit: 'comunidad profesional de UAOS',
    join_desc: 'Únase a la asociación y ayude a construir una cultura de seguridad laboral en Ucrania.',
    join_cta: 'Enviar solicitud',
    footer_desc:
      'Reunimos a fabricantes, proveedores y expertos para desarrollar una cultura de seguridad laboral y elevar los estándares de calidad en Ucrania.',
    footer_nav_title: 'Navegación',
    footer_activity_title: 'Actividades',
    footer_contacts_title: 'Contacto',
    footer_address: '01001, Kyiv,\ncalle Khreshchatyk, 28',
    footer_phone: '+38 (044) 123-45-67',
    footer_email: 'info@uaos.org.ua',
    footer_activity_1: 'Representación de intereses',
    footer_activity_2: 'Normas y calidad',
    footer_activity_3: 'Experiencia y formación',
    footer_activity_4: 'Colaboración',
    footer_copyright: 'Asociación Ucraniana de Seguridad Laboral. Todos los derechos reservados.',
    footer_privacy: 'Política de privacidad',
    footer_terms: 'Condiciones de uso',
    social_linkedin: 'LinkedIn',
    social_facebook: 'Facebook',
    social_youtube: 'YouTube',
    social_telegram: 'Telegram',
    cookie_dialog: 'Consentimiento de cookies',
    cookie_title: 'Cookies',
    cookie_body:
      'Usamos cookies técnicas necesarias para el funcionamiento del sitio. Las cookies analíticas solo tras su consentimiento. Detalles:',
    cookie_privacy_link: 'Política de privacidad',
    cookie_necessary: 'Solo necesarias',
    cookie_accept: 'Aceptar',
    page_not_found: 'Página no encontrada',
    back_home: 'Ir al inicio',
  },
  kk: {
    brand_line_primary: 'Украина қауымдастығы',
    brand_line_secondary: 'кәсіби қауіпсіздік бойынша',
    nav_about: 'Біз туралы',
    nav_participants: 'Қатысушылар',
    nav_news: 'Жаңалықтар',
    nav_contacts: 'Байланыс',
    nav_join: 'Мүше болу',
    nav_admin: 'Admin',
    lang_label: 'KK',
    lang_switch: 'Тіл',
    aria_home: 'Басты бетке',
    aria_main_nav: 'Негізгі навигация',
    aria_theme: 'Түс тақырыбы',
    theme_dark: 'Қараңғы тақырыпты қосу',
    theme_light: 'Жарық тақырыпты қосу',
    theme_dark_title: 'Қараңғы тақырып',
    theme_light_title: 'Жарық тақырып',
    menu_open: 'Мәзірді ашу',
    menu_close: 'Мәзірді жабу',
    hero_title: 'Украинада қауіпсіз еңбек үшін кәсіби қауымдастықты біріктіреміз',
    hero_lead:
      'Өндірушілер, жеткізушілер, сарапшылар және кәсіпорындар бірге заманауи шешімдерді, кәсіби стандарттар мен жауапты нарықты дамытады.',
    hero_cta_join: 'Мүше болу',
    hero_cta_catalog: 'Қатысушылар каталогы',
    hero_index: 'Қауіпсіздік · стандарттар · сараптама · әріптестік',
    hero_side_label: 'Ukraine / professional safety',
    stats_members_value: '128',
    stats_members_label: 'Қауымдастық қатысушылары',
    stats_producers_value: '96',
    stats_producers_label: 'Өндірушілер мен жеткізушілер',
    stats_projects_value: '320+',
    stats_projects_label: 'Іске асырылған жобалар',
    stats_years_value: '12',
    stats_years_label: 'Тиімді жұмыс жылдары',
    stats_aria: 'Қауымдастық көрсеткіштері',
    participants_kicker: 'Кәсіби желі',
    participants_title: 'Қауымдастық қатысушылары',
    participants_link: 'Барлық қатысушыларды көру',
    news_kicker: 'Салалық контекст',
    news_title: 'Жаңалықтар мен жақын оқиғалар',
    news_link: 'Барлық жаңалықтар',
    news_read_more: 'Оқуды жалғастыру',
    join_title_before: 'UAOS',
    join_title_underlit: 'кәсіби қауымдастығына қосылыңыз',
    join_desc: 'Қауымдастыққа қосылыңыз және бізбен бірге Украинада еңбек қауіпсіздігі мәдениетін дамытыңыз.',
    join_cta: 'Өтінім беру',
    footer_desc:
      'Украинада еңбек қауіпсіздігі мәдениетін дамыту және сапа стандарттарын арттыру үшін өндірушілерді, жеткізушілерді және сарапшыларды біріктіреміз.',
    footer_nav_title: 'Навигация',
    footer_activity_title: 'Қызмет',
    footer_contacts_title: 'Байланыс',
    footer_address: '01001, Киев қ.,\nХрещатик к-сі, 28',
    footer_phone: '+38 (044) 123-45-67',
    footer_email: 'info@uaos.org.ua',
    footer_activity_1: 'Мүдделерді білдіру',
    footer_activity_2: 'Стандарттар және сапа',
    footer_activity_3: 'Сараптама және оқыту',
    footer_activity_4: 'Әріптестік',
    footer_copyright: 'Украина кәсіби қауіпсіздік қауымдастығы. Барлық құқықтар қорғалған.',
    footer_privacy: 'Құпиялылық саясаты',
    footer_terms: 'Пайдалану шарттары',
    social_linkedin: 'LinkedIn',
    social_facebook: 'Facebook',
    social_youtube: 'YouTube',
    social_telegram: 'Telegram',
    cookie_dialog: 'Cookie келісімі',
    cookie_title: 'Cookie файлдары',
    cookie_body:
      'Сайт жұмысы үшін қажетті техникалық cookie қолданамыз. Аналитикалық cookie — тек сіздің келісіміңізден кейін. Толығырақ:',
    cookie_privacy_link: 'Құпиялылық саясаты',
    cookie_necessary: 'Тек қажеттілері',
    cookie_accept: 'Қабылдау',
    page_not_found: 'Бет табылмады',
    back_home: 'Басты бетке',
  },
  fr: {
    brand_line_primary: 'Association ukrainienne',
    brand_line_secondary: 'de sécurité professionnelle',
    nav_about: 'À propos',
    nav_participants: 'Membres',
    nav_news: 'Actualités',
    nav_contacts: 'Contacts',
    nav_join: 'Devenir membre',
    nav_admin: 'Admin',
    lang_label: 'FR',
    lang_switch: 'Langue',
    aria_home: 'Accueil',
    aria_main_nav: 'Navigation principale',
    aria_theme: 'Thème de couleur',
    theme_dark: 'Activer le thème sombre',
    theme_light: 'Activer le thème clair',
    theme_dark_title: 'Thème sombre',
    theme_light_title: 'Thème clair',
    menu_open: 'Ouvrir le menu',
    menu_close: 'Fermer le menu',
    hero_title: 'Nous unissons la communauté professionnelle pour un travail sûr en Ukraine',
    hero_lead:
      'Fabricants, fournisseurs, experts et entreprises développent ensemble des solutions modernes, des normes professionnelles et un marché responsable.',
    hero_cta_join: 'Devenir membre',
    hero_cta_catalog: 'Catalogue des membres',
    hero_index: 'Sécurité · normes · expertise · partenariat',
    hero_side_label: 'Ukraine / professional safety',
    stats_members_value: '128',
    stats_members_label: 'Membres de l’Association',
    stats_producers_value: '96',
    stats_producers_label: 'Fabricants et fournisseurs',
    stats_projects_value: '320+',
    stats_projects_label: 'Projets réalisés',
    stats_years_value: '12',
    stats_years_label: 'Années de travail efficace',
    stats_aria: 'Indicateurs de l’Association',
    participants_kicker: 'Réseau professionnel',
    participants_title: 'Membres de l’Association',
    participants_link: 'Voir tous les membres',
    news_kicker: 'Contexte sectoriel',
    news_title: 'Actualités et événements à venir',
    news_link: 'Toutes les actualités',
    news_read_more: 'Lire la suite',
    join_title_before: 'Rejoignez la',
    join_title_underlit: 'communauté professionnelle UAOS',
    join_desc: 'Rejoignez l’association et contribuez à construire une culture de sécurité au travail en Ukraine.',
    join_cta: 'Déposer une demande',
    footer_desc:
      'Nous unissons fabricants, fournisseurs et experts pour développer une culture de sécurité au travail et élever les normes de qualité en Ukraine.',
    footer_nav_title: 'Navigation',
    footer_activity_title: 'Activités',
    footer_contacts_title: 'Contacts',
    footer_address: '01001, Kyiv,\nrue Khrechtchatyk, 28',
    footer_phone: '+38 (044) 123-45-67',
    footer_email: 'info@uaos.org.ua',
    footer_activity_1: 'Représentation des intérêts',
    footer_activity_2: 'Normes et qualité',
    footer_activity_3: 'Expertise et formation',
    footer_activity_4: 'Partenariat',
    footer_copyright: 'Association ukrainienne de sécurité professionnelle. Tous droits réservés.',
    footer_privacy: 'Politique de confidentialité',
    footer_terms: 'Conditions d’utilisation',
    social_linkedin: 'LinkedIn',
    social_facebook: 'Facebook',
    social_youtube: 'YouTube',
    social_telegram: 'Telegram',
    cookie_dialog: 'Consentement aux cookies',
    cookie_title: 'Cookies',
    cookie_body:
      'Nous utilisons des cookies techniques nécessaires au fonctionnement du site. Les cookies analytiques uniquement après votre consentement. Détails :',
    cookie_privacy_link: 'Politique de confidentialité',
    cookie_necessary: 'Nécessaires uniquement',
    cookie_accept: 'Accepter',
    page_not_found: 'Page introuvable',
    back_home: 'Retour à l’accueil',
  },
}
