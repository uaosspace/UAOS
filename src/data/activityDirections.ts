import type {ActivityDirection} from '../types'

/**
 * Єдине джерело даних для 4 напрямів діяльності UAOS.
 * Використовується і на головній (FeaturesSection), і на /activity (ActivityPage),
 * щоб уникнути дублювання копірайту в різних місцях.
 */
export const ACTIVITY_DIRECTIONS: ActivityDirection[] = [
  {
    id: 'representation',
    anchor: 'representation',
    icon: 'icon-shield',
    sortOrder: 1,
    title: {
      uk: 'Представництво інтересів галузі',
      en: 'Industry representation',
    },
    shortDescription: {
      uk: 'Представляємо та відстоюємо інтереси учасників сфери безпеки праці на державному та галузевому рівнях.',
      en: 'We represent and defend the interests of occupational safety market participants at the state and industry level.',
    },
    description: {
      uk: 'UAOS виступає голосом виробників, постачальників і експертів у сфері безпеки праці перед державними органами, регуляторами та галузевими об’єднаннями. Ми формуємо консолідовану позицію ринку та доносимо її до тих, хто ухвалює рішення.',
      en: 'UAOS speaks on behalf of manufacturers, suppliers, and experts in occupational safety before state authorities, regulators, and industry associations. We build a consolidated market position and bring it to decision-makers.',
    },
    goals: [
      {
        uk: 'Захист інтересів учасників асоціації у діалозі з державними органами',
        en: 'Protecting members’ interests in dialogue with state authorities',
      },
      {
        uk: 'Участь у підготовці та обговоренні законодавчих інціатив у сфері охорони праці',
        en: 'Participation in drafting and discussing occupational safety legislation',
      },
      {
        uk: 'Формування позитивного іміджу галузі та її учасників',
        en: 'Building a positive image of the industry and its participants',
      },
    ],
    formats: [
      {uk: 'Робочі групи та консультації з регуляторами', en: 'Working groups and consultations with regulators'},
      {uk: 'Офіційні звернення та позиційні документи', en: 'Official appeals and position papers'},
      {uk: 'Участь у профільних заходах і форумах', en: 'Participation in industry events and forums'},
    ],
  },
  {
    id: 'standards',
    anchor: 'standards',
    icon: 'icon-doc',
    sortOrder: 2,
    title: {
      uk: 'Стандарти, якість і сертифікація',
      en: 'Standards, quality and certification',
    },
    shortDescription: {
      uk: 'Розробляємо та впроваджуємо сучасні стандарти якості засобів захисту та практик безпеки праці.',
      en: 'We develop and implement modern quality standards for protective equipment and occupational safety practices.',
    },
    description: {
      uk: 'Напрям об’єднує роботу над національними стандартами, регламентами та практиками сертифікації засобів індивідуального захисту. Мета — відповідальний і якісний ринок, де вимоги безпеки не декларативні, а реально виконуються.',
      en: 'This direction covers work on national standards, regulations, and certification practices for personal protective equipment. The goal is a responsible, high-quality market where safety requirements are actually met, not just declared.',
    },
    goals: [
      {
        uk: 'Участь у вдосконаленні стандартів та регламентів у сфері ЗІЗ',
        en: 'Contributing to the improvement of PPE standards and regulations',
      },
      {
        uk: 'Розвиток якісного та відповідального ринку засобів захисту',
        en: 'Developing a responsible, high-quality protective equipment market',
      },
      {
        uk: 'Поширення сучасних європейських підходів до безпеки праці',
        en: 'Promoting modern European approaches to occupational safety',
      },
    ],
    formats: [
      {uk: 'Експертні комісії з питань стандартизації', en: 'Expert standardization committees'},
      {uk: 'Аналітичні огляди нормативної бази', en: 'Regulatory framework analytical reviews'},
      {uk: 'Рекомендації для учасників ринку', en: 'Recommendations for market participants'},
    ],
  },
  {
    id: 'expertise',
    anchor: 'expertise',
    icon: 'icon-cap',
    sortOrder: 3,
    title: {
      uk: 'Експертиза та навчання',
      en: 'Expertise and training',
    },
    shortDescription: {
      uk: 'Організовуємо навчальні програми, семінари та обмін досвідом для професіоналів сфери безпеки праці.',
      en: 'We organize training programs, seminars, and knowledge exchange for occupational safety professionals.',
    },
    description: {
      uk: 'UAOS об’єднує експертні знання й практичні компетенції учасників асоціації, щоб поширювати їх серед підприємств, фахівців з охорони праці та молодих спеціалістів галузі.',
      en: 'UAOS combines expert knowledge and practical competencies of its members to share them with enterprises, occupational safety professionals, and young industry specialists.',
    },
    goals: [
      {
        uk: 'Об’єднання експертних знань і практичних компетенцій учасників',
        en: 'Combining expert knowledge and practical competencies of members',
      },
      {
        uk: 'Розвиток культури безпеки праці в Україні',
        en: 'Developing occupational safety culture in Ukraine',
      },
      {
        uk: 'Підтримка молодих фахівців і обмін досвідом між поколіннями',
        en: 'Supporting young professionals and cross-generation knowledge exchange',
      },
    ],
    formats: [
      {uk: 'Тренінги та практичні семінари', en: 'Trainings and practical seminars'},
      {uk: 'Конференції та галузеві зустрічі', en: 'Conferences and industry meetups'},
      {uk: 'Спільна база знань та кейсів учасників', en: 'Shared knowledge base and case library'},
    ],
  },
  {
    id: 'partnership',
    anchor: 'partnership',
    icon: 'icon-globe',
    sortOrder: 4,
    title: {
      uk: 'Партнерство та міжнародна співпраця',
      en: 'Partnership and international cooperation',
    },
    shortDescription: {
      uk: 'Розвиваємо партнерство з міжнародними організаціями та беремо участь у глобальних ініціативах безпеки праці.',
      en: 'We build partnerships with international organizations and participate in global occupational safety initiatives.',
    },
    description: {
      uk: 'Ми підтримуємо позитивний імідж учасників асоціації як надійних партнерів і розвиваємо зв’язки з іноземними об’єднаннями, щоб інтегрувати українську галузь безпеки праці в міжнародний контекст.',
      en: 'We support the positive image of association members as reliable partners and build ties with foreign associations to integrate the Ukrainian occupational safety industry into the international context.',
    },
    goals: [
      {
        uk: 'Підтримка позитивного іміджу учасників як надійних партнерів',
        en: 'Supporting the positive image of members as reliable partners',
      },
      {
        uk: 'Розвиток партнерства з міжнародними галузевими організаціями',
        en: 'Developing partnerships with international industry organizations',
      },
      {
        uk: 'Участь у глобальних ініціативах з безпеки праці',
        en: 'Participation in global occupational safety initiatives',
      },
    ],
    formats: [
      {uk: 'Меморандуми та угоди про співпрацю', en: 'Memoranda and cooperation agreements'},
      {uk: 'Участь у міжнародних виставках і конференціях', en: 'Participation in international exhibitions and conferences'},
      {uk: 'Обмін досвідом з іноземними асоціаціями', en: 'Experience exchange with foreign associations'},
    ],
  },
]
