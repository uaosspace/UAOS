/**
 * Легасі-словник (uk/en; de/es/kk/fr fallback на en через legacyEn у translations.ts) для
 * нових сторінок реструктуризації: /activity, /members, /knowledge, /join, блоки головної.
 */
export const pagesTranslations = {
  uk: {
    activity_intro:
      'Чотири напрями, у яких UAOS системно працює для розвитку професійної безпеки праці в Україні.',
    activity_goals_label: 'Цілі напряму',
    activity_formats_label: 'Формати роботи',

    members_featured_badge: 'Рекомендовано',

    news_page_subtitle: 'Останні події, ініціативи та новини галузевого життя асоціації UAOS.',
    news_empty: 'Новин не знайдено',

    knowledge_intro:
      'Публікації, практичні матеріали та офіційні документи асоціації — відкриті для перегляду без реєстрації.',
    knowledge_materials_kicker: 'Публікації та матеріали',
    knowledge_materials_title: 'Практичні матеріали від експертів UAOS',

    audience_kicker: 'Для кого',
    audience_title: 'Для кого створена UAOS',
    audience_subtitle: 'Асоціація об’єднує три ключові групи учасників ринку безпеки праці',
    audience_producer_title: 'Виробники та постачальники',
    audience_producer_desc:
      'Підтвердження надійності, доступ до галузевого діалогу з регуляторами та представлення в каталозі асоціації.',
    audience_consumer_title: 'Підприємства-споживачі',
    audience_consumer_desc:
      'Перевірені партнери, актуальні стандарти та практичні консультації з підбору засобів захисту.',
    audience_expert_title: 'Експерти та професійні організації',
    audience_expert_desc:
      'Професійне середовище для обміну знаннями, участі в навчальних програмах і галузевих ініціативах.',
    audience_cta: 'Дізнатися про вступ',

    advantages_kicker: 'Переваги участі',
    advantages_title: 'Що отримує учасник UAOS',
    advantages_1_title: 'Професійне представництво',
    advantages_1_desc: 'Ваші інтереси представлені в діалозі з державними органами та галузевими об’єднаннями.',
    advantages_2_title: 'Участь у галузевих ініціативах',
    advantages_2_desc: 'Долучення до робочих груп, стандартизації та спільних проєктів асоціації.',
    advantages_3_title: 'Доступ до експертного середовища',
    advantages_3_desc: 'Навчання, консультації та обмін досвідом з фахівцями з охорони праці.',
    advantages_4_title: 'Представлення в каталозі UAOS',
    advantages_4_desc: 'Публічний профіль компанії в каталозі учасників асоціації.',
    advantages_5_title: 'Участь у заходах і робочих групах',
    advantages_5_desc: 'Запрошення на конференції, семінари та тематичні зустрічі учасників.',

    join_page_intro:
      'UAOS відкрита для виробників і постачальників засобів захисту, підприємств-споживачів та незалежних експертів з охорони праці.',
    join_steps_title: 'Як відбувається вступ',
    join_step_1_title: 'Подання заявки',
    join_step_1_desc: 'Заповніть форму нижче — це займе кілька хвилин.',
    join_step_2_title: 'Розгляд заявки',
    join_step_2_desc: 'Представники асоціації розглядають заявку та за потреби зв’язуються з вами.',
    join_step_3_title: 'Рішення про вступ',
    join_step_3_desc: 'Ви отримуєте відповідь щодо рішення на вказану електронну пошту.',
    join_step_4_title: 'Старт участі',
    join_step_4_desc: 'Після підтвердження ваш профіль з’являється в каталозі учасників UAOS.',

    join_form_applicant_kind_lbl: 'Тип заявника',
    join_form_sector_lbl: 'Галузь / сектор',
    join_form_category_lbl: 'Категорія продукції або послуг',
    join_form_competency_lbl: 'Компетенції',
    join_form_terms_consent: 'Я підтверджую достовірність наданої інформації та ознайомлений(а) з умовами участі.',
    join_form_submit_btn: 'Надіслати заявку',
    join_form_submitting: 'Надсилання...',
  },
  en: {
    activity_intro:
      'Four directions where UAOS works systematically to advance occupational safety culture in Ukraine.',
    activity_goals_label: 'Direction goals',
    activity_formats_label: 'Working formats',

    members_featured_badge: 'Featured',

    news_page_subtitle: 'The latest events, initiatives, and industry news from the UAOS association.',
    news_empty: 'No news found',

    knowledge_intro:
      'Publications, practical materials, and official association documents — open for viewing without registration.',
    knowledge_materials_kicker: 'Publications and materials',
    knowledge_materials_title: 'Practical materials from UAOS experts',

    audience_kicker: 'Who UAOS is for',
    audience_title: 'Who UAOS was created for',
    audience_subtitle: 'The association brings together three key groups of occupational safety market participants',
    audience_producer_title: 'Producers and suppliers',
    audience_producer_desc:
      'Verified reliability status, access to industry dialogue with regulators, and a listing in the association catalog.',
    audience_consumer_title: 'Consumer enterprises',
    audience_consumer_desc:
      'Verified partners, up-to-date standards, and practical consulting on selecting protective equipment.',
    audience_expert_title: 'Experts and professional organizations',
    audience_expert_desc:
      'A professional environment for knowledge exchange, training programs, and industry initiatives.',
    audience_cta: 'Learn how to join',

    advantages_kicker: 'Membership advantages',
    advantages_title: 'What UAOS members get',
    advantages_1_title: 'Professional representation',
    advantages_1_desc: 'Your interests represented in dialogue with state authorities and industry associations.',
    advantages_2_title: 'Participation in industry initiatives',
    advantages_2_desc: 'Involvement in working groups, standardization, and joint association projects.',
    advantages_3_title: 'Access to the expert environment',
    advantages_3_desc: 'Training, consulting, and knowledge exchange with occupational safety professionals.',
    advantages_4_title: 'Listing in the UAOS catalog',
    advantages_4_desc: 'A public company profile in the association’s member catalog.',
    advantages_5_title: 'Participation in events and working groups',
    advantages_5_desc: 'Invitations to conferences, seminars, and thematic member meetings.',

    join_page_intro:
      'UAOS is open to manufacturers and suppliers of protective equipment, consumer enterprises, and independent occupational safety experts.',
    join_steps_title: 'How joining works',
    join_step_1_title: 'Submit an application',
    join_step_1_desc: 'Fill in the form below — it only takes a few minutes.',
    join_step_2_title: 'Application review',
    join_step_2_desc: 'Association representatives review the application and may contact you if needed.',
    join_step_3_title: 'Decision on membership',
    join_step_3_desc: 'You receive a decision by email to the address you provided.',
    join_step_4_title: 'Membership starts',
    join_step_4_desc: 'Once confirmed, your profile appears in the UAOS member catalog.',

    join_form_applicant_kind_lbl: 'Applicant type',
    join_form_sector_lbl: 'Industry / sector',
    join_form_category_lbl: 'Product or service category',
    join_form_competency_lbl: 'Competencies',
    join_form_terms_consent: 'I confirm the accuracy of the information provided and have read the membership terms.',
    join_form_submit_btn: 'Submit application',
    join_form_submitting: 'Submitting...',
  },
}
