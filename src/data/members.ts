import {AssociationMember} from '../types'
import {ContentApiError, fetchContentItems} from '../lib/contentApi'
import {
  isRecord,
  readArray,
  readHttpUrl,
  readLocalizedText,
  readMemberProfileLevel,
  readString,
  readStringArray,
  readStringOr,
} from '../lib/contentGuards'

/**
 * Seed учасників зі скріна «Члени спілки».
 * Описи зібрані з публічних сайтів компаній (seed fallback без CMS).
 */
export const INITIAL_MEMBERS: AssociationMember[] = [
  {
    id: 'effetex',
    slug: 'effetex',
    order: 1,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'ТОВ «Еффітекс»',
      en: 'EffeTex LLC',
    },
    shortName: 'EffeTex',
    category: {
      uk: 'Аутсорсинг спецодягу',
      en: 'Workwear outsourcing',
    },
    shortDescription: {
      uk: 'Оренда та комплексне обслуговування спецодягу з RFID-обліком по всій Україні.',
      en: 'Workwear rental and full-cycle servicing with RFID tracking across Ukraine.',
    },
    fullDescription: {
      uk: 'EffeTex з 2018 року надає послуги оренди та обслуговування спецодягу: розробка моделей, прання, ремонт, заміна та облік. Компанія обслуговує підприємства по всій Україні (рітейл, логістика, харчова та важка промисловість, агро), використовує RFID і клієнтський портал. За публічними даними компанії — десятки тисяч співробітників клієнтів і сотні тисяч одиниць одягу в обороті.',
      en: 'Since 2018 EffeTex provides workwear rental and maintenance: design, industrial laundry, repair, replacement, and inventory control. The company serves enterprises across Ukraine (retail, logistics, food and heavy industry, agriculture), using RFID and a customer portal. Public company materials cite tens of thousands of client employees and hundreds of thousands of garments in circulation.',
    },
    logoUrl: '/members/effetex.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1545156521-77bd8567090f?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://effetex.com/',
    publicEmail: 'support2@effetex.com',
    competencies: [
      {uk: 'Оренда спецодягу без застави', en: 'Workwear rental without collateral'},
      {uk: 'Прання, ремонт і заміна', en: 'Laundry, repair, and replacement'},
      {uk: 'RFID-облік і клієнтський портал', en: 'RFID tracking and customer portal'},
      {uk: 'Брендований корпоративний стиль', en: 'Branded corporate uniform programs'},
    ],
    services: [
      {uk: 'Аутсорсинг спецодягу «під ключ»', en: 'Turnkey workwear outsourcing'},
      {uk: 'Онлайн-замовлення нової форми', en: 'Online ordering of new garments'},
      {uk: 'Заявки на ремонт через QR-код', en: 'Repair requests via QR code'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing', 'logistics'],
    productCategories: ['ppe-clothing'],
    region: 'Київ',
    featured: true,
  },
  {
    id: 'insight',
    slug: 'insight',
    order: 2,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'ТОВ «Інсайт.УА»',
      en: 'Insight.UA LLC',
    },
    shortName: 'INSIGHT',
    category: {
      uk: 'Виробник спецодягу',
      en: 'Workwear manufacturer',
    },
    shortDescription: {
      uk: 'Український виробник функціонального спецодягу та спецвзуття з 2010 року.',
      en: 'Ukrainian manufacturer of functional workwear and safety footwear since 2010.',
    },
    fullDescription: {
      uk: 'INSIGHT працює на ринку ЗІЗ з 2010 року і є одним із провідних українських виробників робочого та захисного одягу. Компанія має власне виробництво й склад у Чернігові, розробляє моделі, впроваджує сучасні технології пошиву та контролює якість. Продукція відповідає вимогам технічного регламенту ЗІЗ, національним стандартам України та ЄС; матеріали мають маркування OEKO-TEX® STANDARD 100.',
      en: 'INSIGHT has operated in the PPE market since 2010 and is among Ukraine’s leading workwear and protective clothing manufacturers. The company runs its own production and warehouse in Chernihiv, develops designs, applies modern manufacturing technology, and controls quality. Products meet PPE technical regulation requirements and Ukrainian/EU standards; materials carry OEKO-TEX® STANDARD 100 labeling.',
    },
    logoUrl: '/members/insight.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://insight.ua/',
    publicEmail: 'info@insight.ua',
    publicPhone: '+38 (063) 262-51-64',
    competencies: [
      {uk: 'Власне виробництво спецодягу', en: 'In-house workwear manufacturing'},
      {uk: 'Сигнальний одяг підвищеної видимості', en: 'High-visibility workwear'},
      {uk: 'Корпоративний і брендований одяг', en: 'Corporate and branded apparel'},
      {uk: 'Сертифіковані тканини та ЗІЗ', en: 'Certified fabrics and PPE'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing'],
    productCategories: ['ppe-clothing', 'ppe-footwear'],
    region: 'Чернігів',
    featured: true,
  },
  {
    id: 'biko',
    slug: 'biko',
    order: 3,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'ТОВ «Компанія «БІКО»',
      en: 'Biko Company LLC',
    },
    shortName: 'БІКО',
    category: {
      uk: 'Дистрибуція ЗІЗ',
      en: 'PPE distribution',
    },
    shortDescription: {
      uk: 'Комплексне постачання ЗІЗ, спецодягу та спецвзуття; офіційний дистриб’ютор 3M в Україні.',
      en: 'Full-range PPE, workwear and safety footwear supply; official 3M distributor in Ukraine.',
    },
    fullDescription: {
      uk: 'ТОВ «Компанія «БІКО» з 2007 року забезпечує підприємства засобами індивідуального захисту, робочим одягом і промисловими товарами. Компанія є офіційним дистриб’ютором брендів 3M, JSP, MFA, Safety Jogger, Kimberly-Clark, Portwest, Silent, Polyco та розвиває власну торгову марку BSPKA. Центральний офіс — у Дніпрі, філії — у Києві, Харкові та Львові.',
      en: 'Since 2007 Biko Company LLC supplies enterprises with PPE, workwear, and industrial goods. The company is an official distributor of 3M, JSP, MFA, Safety Jogger, Kimberly-Clark, Portwest, Silent, and Polyco, and develops its own BSPKA brand. Headquarters are in Dnipro, with branches in Kyiv, Kharkiv, and Lviv.',
    },
    logoUrl: '/members/biko.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://biko.ua/',
    publicEmail: 'shop@biko.ua',
    publicPhone: '+38 (050) 403-27-99',
    competencies: [
      {uk: 'Офіційна дистрибуція 3M', en: 'Official 3M distribution'},
      {uk: 'Власне виробництво ТМ BSPKA', en: 'Own BSPKA brand manufacturing'},
      {uk: 'Повний спектр ЗІЗ і спецодягу', en: 'Full PPE and workwear range'},
      {uk: 'Мережа філій по Україні', en: 'Branch network across Ukraine'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing', 'construction', 'retail'],
    productCategories: ['ppe-clothing', 'ppe-footwear', 'ppe-head-eye-ear', 'ppe-hand'],
    region: 'Дніпро',
    featured: false,
  },
  {
    id: 'deltaplus',
    slug: 'deltaplus',
    order: 4,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'Delta Plus',
      en: 'Delta Plus',
    },
    shortName: 'DELTAPLUS',
    category: {
      uk: 'Виробник ЗІЗ',
      en: 'PPE manufacturer',
    },
    shortDescription: {
      uk: 'Французький виробник повного спектра ЗІЗ: одяг, взуття, рукавиці, захист голови та висотні системи.',
      en: 'French manufacturer of full-range PPE: clothing, footwear, gloves, head protection, and fall systems.',
    },
    fullDescription: {
      uk: 'Delta Plus — провідний французький виробник засобів індивідуального захисту з глобальною присутністю. Компанія розробляє та виготовляє захисний одяг, спецвзуття, рукавиці, засоби захисту голови, очей, слуху, дихання та рішення для робіт на висоті. Продукція орієнтована на комфорт, ергономіку та відповідність міжнародним стандартам безпеки.',
      en: 'Delta Plus is a leading French PPE manufacturer with a global footprint. The company designs and produces protective clothing, safety footwear, gloves, head/eye/hearing/respiratory protection, and fall-protection solutions. Products focus on comfort, ergonomics, and compliance with international safety standards.',
    },
    logoUrl: '/members/deltaplus.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://www.deltaplus.eu/uk/',
    competencies: [
      {uk: 'Захисний одяг і спецвзуття', en: 'Protective clothing and safety footwear'},
      {uk: 'Захист рук, голови, очей і слуху', en: 'Hand, head, eye, and hearing protection'},
      {uk: 'Системи захисту від падіння', en: 'Fall protection systems'},
      {uk: 'Глобальна експертиза Made in Delta Plus', en: 'Global Made in Delta Plus expertise'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing', 'construction'],
    productCategories: ['ppe-clothing', 'ppe-footwear', 'ppe-hand', 'height-safety'],
    region: 'Франція',
    featured: true,
  },
  {
    id: 'ultrasafety',
    slug: 'ultrasafety',
    order: 5,
    published: true,
    profileLevel: 'basic',
    name: {
      uk: 'ТОВ «Ультрасейфеті»',
      en: 'UltraSafety LLC',
    },
    shortName: 'ULTRA SAFETY',
    category: {
      uk: 'Постачання ЗІЗ',
      en: 'PPE supply',
    },
    shortDescription: {
      uk: 'Комплексне постачання спецодягу, спецвзуття та ЗІЗ провідних світових брендів.',
      en: 'Comprehensive supply of workwear, safety footwear, and PPE from leading global brands.',
    },
    fullDescription: {
      uk: 'ТОВ «Ультрасейфеті» спеціалізується на професійному підборі та комплексному постачанні засобів індивідуального захисту, спецодягу й спецвзуття. Асортимент охоплює одяг, взуття, захист голови, зору, слуху, дихання, рук і висотне спорядження від міжнародних виробників.',
      en: 'UltraSafety LLC specializes in professional selection and comprehensive supply of PPE, workwear, and safety footwear. The assortment covers clothing, footwear, head/eye/hearing/respiratory/hand protection, and height equipment from international manufacturers.',
    },
    logoUrl: '/members/ultrasafety.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://ultrasafety.com.ua/',
    publicEmail: 'sale@ultrasafety.com.ua',
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing', 'retail'],
    productCategories: ['ppe-clothing', 'ppe-footwear'],
    region: 'Київ',
    featured: false,
  },
  {
    id: 'assecuro',
    slug: 'assecuro',
    order: 6,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'ТОВ «Ассекуро Україна»',
      en: 'Assecuro Ukraine LLC',
    },
    shortName: 'ASSECURO',
    category: {
      uk: 'Безпека робіт на висоті',
      en: 'Work-at-height safety',
    },
    shortDescription: {
      uk: 'ЗІЗ і системи для робіт на висоті та під напругою: проєктування, монтаж, навчання.',
      en: 'PPE and systems for work at height and under voltage: design, installation, training.',
    },
    fullDescription: {
      uk: 'Assecuro Ukraine — дочірня компанія польського виробника ASSECURO Sp. z o.o. з понад 30-річним досвідом у ЄС і понад 15-річною присутністю в Україні. Спеціалізація — охорона праці під час робіт на висоті та під напругою: постачання ЗІЗ, проєктування й монтаж систем безпеки/евакуації, автоматизація обліку ЗІЗ, навчання персоналу. Компанія має лабораторію випробувань і тренувальну базу.',
      en: 'Assecuro Ukraine is a subsidiary of Polish manufacturer ASSECURO Sp. z o.o., with 30+ years of EU experience and 15+ years in Ukraine. Focus areas: work-at-height and live-work safety — PPE supply, design and installation of safety/evacuation systems, PPE inventory automation, and staff training. The company operates a testing lab and training facility.',
    },
    logoUrl: '/members/assecuro.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://assecuro.ua/',
    publicEmail: 'office@assecuro.ua',
    competencies: [
      {uk: 'ЗІЗ від падіння з висоти', en: 'Fall-arrest PPE'},
      {uk: 'Проєктування та монтаж систем', en: 'System design and installation'},
      {uk: 'Навчання висотних робіт', en: 'Work-at-height training'},
      {uk: 'Роботи під напругою (HUBIX)', en: 'Live-work solutions (HUBIX)'},
    ],
    services: [
      {uk: 'Аудит безпеки робіт на висоті', en: 'Work-at-height safety audits'},
      {uk: 'Монтаж анкерних ліній', en: 'Anchor line installation'},
      {uk: 'Виїзні випробування ЗІЗ', en: 'On-site PPE testing'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier', 'expert-org'],
    sectors: ['construction', 'energy'],
    productCategories: ['height-safety', 'training-services'],
    region: 'Київ',
    featured: true,
  },
  {
    id: 'epg',
    slug: 'epg',
    order: 7,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'ТОВ «Інженерно-Промислова Група»',
      en: 'Engineering Industrial Group LLC',
    },
    shortName: 'EPG',
    category: {
      uk: 'Промислова безпека та обладнання',
      en: 'Industrial safety and equipment',
    },
    shortDescription: {
      uk: 'Офіційний дистриб’ютор ROSS і Ramsey в Україні: пневматика та рішення для безпеки виробництва.',
      en: 'Official ROSS and Ramsey distributor in Ukraine: pneumatics and industrial safety solutions.',
    },
    fullDescription: {
      uk: '«Інженерно-Промислова Група» (EPG) зареєстрована у 2005 році. З 2006 року компанія — ексклюзивний офіційний дистриб’ютор промислової пневматики ROSS EUROPA GmbH (Німеччина) в Україні; з 2019 року представляє безшумні зубчасті ланцюги Ramsey Products Corporation (США). Напрямки — обладнання для склотари, металургії, алюмінієвої та пресової промисловості, а також рішення для безпеки на виробництві, зокрема ізоляція енергії / LOTO.',
      en: 'Engineering Industrial Group (EPG) was registered in 2005. Since 2006 it has been the exclusive official distributor of ROSS EUROPA GmbH industrial pneumatics in Ukraine; since 2019 it also represents Ramsey Products Corporation silent roller chains (USA). Focus areas include glass container, metallurgy, aluminum and press industries, plus industrial safety solutions including energy isolation / LOTO.',
    },
    logoUrl: '/members/epg.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1513828742140-ccaa34f327bc?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://epg.biz.ua/',
    publicEmail: 'office@epg.biz.ua',
    competencies: [
      {uk: 'Пневматика ROSS EUROPA', en: 'ROSS EUROPA pneumatics'},
      {uk: 'Ланцюги Ramsey', en: 'Ramsey silent chains'},
      {uk: 'Системи LOTO / ізоляція енергії', en: 'LOTO / energy isolation systems'},
      {uk: 'Обладнання для склотари', en: 'Glass container industry equipment'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing', 'metallurgy'],
    productCategories: ['other-product'],
    region: 'Київ',
    featured: false,
  },
  {
    id: 'portal313',
    slug: 'portal313',
    order: 8,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'Portal313 / ОЛ&ТЕ Груп',
      en: 'Portal313 / OL&TE Group',
    },
    shortName: 'PORTAL313',
    category: {
      uk: 'Екосистема безпеки праці',
      en: 'Occupational safety ecosystem',
    },
    shortDescription: {
      uk: 'Перша українська екосистема: ЗІЗ, спецодяг, VR-навчання та експертний супровід.',
      en: 'Ukraine’s first ecosystem: PPE, workwear, VR training, and expert support.',
    },
    fullDescription: {
      uk: 'Portal313 — екосистема рішень з охорони праці від ТОВ «ОЛ&ТЕ Груп». Об’єднує інтернет-торгівлю сертифікованими ЗІЗ і спецодягом, експертні консультації, VR-навчання та впровадження систем менеджменту безпеки. Компанія є офіційним дилером Portwest, Safety Jogger, Assecuro, Ardon, Delta Plus, BSafe та ін., а також партнером VR-програм 4HELP. Підхід — системний: підбір під ризики, навчання персоналу, контроль процесів.',
      en: 'Portal313 is an occupational safety solutions ecosystem by OL&TE Group LLC. It combines e-commerce of certified PPE and workwear, expert consulting, VR training, and safety management systems. The company is an official dealer for Portwest, Safety Jogger, Assecuro, Ardon, Delta Plus, BSafe and others, and a partner for 4HELP VR programs. Approach is systemic: risk-based selection, staff training, and process control.',
    },
    logoUrl: '/members/portal313.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://portal313.com.ua/',
    competencies: [
      {uk: 'Підбір ЗІЗ під ризики підприємства', en: 'Risk-based PPE selection'},
      {uk: 'VR-навчання з безпеки', en: 'VR safety training'},
      {uk: 'Аудит та консалтинг з ОП', en: 'OHS audit and consulting'},
      {uk: 'Дистрибуція європейських брендів', en: 'European brand distribution'},
    ],
    services: [
      {uk: 'Комплексна поставка ЗІЗ і спецодягу', en: 'Turnkey PPE and workwear supply'},
      {uk: 'Навчання відповідальних осіб', en: 'Responsible person training'},
      {uk: 'Атестація робочих місць', en: 'Workplace assessment'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier', 'expert-org'],
    sectors: ['manufacturing', 'construction', 'logistics'],
    productCategories: ['ppe-clothing', 'ppe-footwear', 'training-services'],
    region: 'Київ',
    featured: true,
  },
  {
    id: 'stg',
    slug: 'stg',
    order: 9,
    published: true,
    profileLevel: 'extended',
    name: {
      uk: 'STG — Special Textile Group',
      en: 'STG — Special Textile Group',
    },
    shortName: 'STG',
    category: {
      uk: 'Захисні тканини',
      en: 'Protective fabrics',
    },
    shortDescription: {
      uk: 'Виробничо-торгівельна компанія інноваційних захисних тканин для спецодягу з 2006 року.',
      en: 'Manufacturer-distributor of innovative protective fabrics for workwear since 2006.',
    },
    fullDescription: {
      uk: 'STG заснована у 2006 році і постачає високоякісні захисні тканини для українського ринку спецодягу. Компанія — ексклюзивний представник Sapphire Finishing Mills (Пакистан) і Daletec (Норвегія), учасник розробки галузевих норм ЗІЗ з 2010 року. Серед клієнтів — DTEK, Метінвест, Укрзалізниця, Ferrexpo, ArcelorMittal та інші. З 2022 року розвиває європейський напрям (логістичний центр у Жешуві, Польща).',
      en: 'Founded in 2006, STG supplies high-quality protective fabrics for Ukraine’s workwear market. The company is the exclusive representative of Sapphire Finishing Mills (Pakistan) and Daletec (Norway) and has contributed to PPE industry norms since 2010. Clients include DTEK, Metinvest, Ukrzaliznytsia, Ferrexpo, ArcelorMittal and others. Since 2022 it has expanded in Europe (logistics hub in Rzeszów, Poland).',
    },
    logoUrl: '/members/stg.png?v=2',
    coverImageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800',
    websiteUrl: 'https://stg.ua/',
    publicEmail: 'info@stg.ua',
    competencies: [
      {uk: 'Вогнестійкі та захисні тканини', en: 'Flame-retardant and protective fabrics'},
      {uk: 'Ексклюзив Daletec і Sapphire', en: 'Exclusive Daletec and Sapphire lines'},
      {uk: 'Участь у розробці норм ЗІЗ', en: 'Contribution to PPE standards'},
      {uk: 'Постачання для важкої промисловості', en: 'Supply for heavy industry'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['producer-supplier'],
    sectors: ['manufacturing', 'metallurgy'],
    productCategories: ['ppe-clothing'],
    region: 'Україна / Польща',
    featured: false,
  },
  {
    id: 'eosb',
    slug: 'eosb',
    order: 10,
    published: true,
    profileLevel: 'basic',
    name: {
      uk: 'ГО «Експертне об’єднання з безпеки праці»',
      en: 'Occupational Safety Experts Union NGO',
    },
    shortName: 'ЕОСБ',
    category: {
      uk: 'Навчання та експертиза з охорони праці',
      en: 'Occupational safety training and expertise',
    },
    shortDescription: {
      uk: 'Громадська організація фахівців з охорони праці: навчання, аудит ризиків і консультації для підприємств.',
      en: 'A professional NGO of occupational safety specialists: training, risk audits, and consulting for enterprises.',
    },
    fullDescription: {
      uk: 'ЕОСБ об’єднує незалежних експертів з охорони праці та проводить навчальні програми, аудит робочих місць і консультації щодо застосування засобів індивідуального захисту для малих і середніх підприємств. Організація співпрацює з галузевими асоціаціями та підтримує поширення сучасних практик безпеки праці в регіонах України.',
      en: 'ЕОСБ brings together independent occupational safety experts and runs training programs, workplace audits, and consulting on personal protective equipment for small and medium enterprises. The organization cooperates with industry associations and promotes modern occupational safety practices across Ukraine’s regions.',
    },
    logoUrl: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800',
    publicEmail: 'contact@eosb.org.ua',
    competencies: [
      {uk: 'Аудит ризиків на робочих місцях', en: 'Workplace risk audits'},
      {uk: 'Навчання з охорони праці', en: 'Occupational safety training'},
      {uk: 'Консультації з підбору ЗІЗ', en: 'PPE selection consulting'},
    ],
    lastUpdated: '2026-08-02',
    participantTypes: ['expert-org'],
    sectors: ['manufacturing', 'construction', 'agriculture'],
    region: 'Львів',
    featured: false,
  },
]

/**
 * Преобразует документ участника (public API / seed-совместимый) в UI-модель.
 */
export function mapMember(doc: unknown): AssociationMember {
  const source = isRecord(doc) ? doc : {}
  const memberId = readStringOr(source.id, readStringOr(source._id, 'member-unknown'))
  const sectorsList = readStringArray(source.sectors)
  const productCategoriesList = readStringArray(source.productCategories)
  const logoUrl = readStringOr(source.logoUrl, '')
  const coverImageUrl = readStringOr(source.coverImageUrl, '')

  return {
    id: memberId,
    slug: readString(source.slug) || memberId,
    order: typeof source.order === 'number' ? source.order : 0,
    published: source.published === undefined ? true : Boolean(source.published),
    profileLevel: readMemberProfileLevel(source.profileLevel),
    name: readLocalizedText(source.name),
    shortName: readStringOr(source.shortName, ''),
    category: readLocalizedText(source.category),
    shortDescription: readLocalizedText(source.shortDescription),
    fullDescription: readLocalizedText(source.fullDescription),
    logoUrl: logoUrl || readStringOr(source.shortName, ''),
    coverImageUrl,
    websiteUrl: readHttpUrl(source.websiteUrl),
    publicEmail: readString(source.publicEmail),
    publicPhone: readString(source.publicPhone),
    participantTypes: readStringArray(source.participantTypes),
    sectors: sectorsList.length ? sectorsList : undefined,
    productCategories: productCategoriesList.length ? productCategoriesList : undefined,
    region: readString(source.region),
    featured: Boolean(source.featured),
    competencies: readArray(source.competencies).length
      ? readArray(source.competencies).map((competency) =>
          typeof competency === 'string'
            ? {uk: competency, en: competency}
            : readLocalizedText(competency),
        )
      : undefined,
    services: readArray(source.services).length
      ? readArray(source.services).map((service) =>
          typeof service === 'string' ? {uk: service, en: service} : readLocalizedText(service),
        )
      : undefined,
    certificates: readArray(source.certificates).length
      ? readArray(source.certificates).map((certificate, index) => {
          const item = isRecord(certificate) ? certificate : {}
          return {
            id: readStringOr(item.id, `cert-${memberId}-${index}`),
            title: readLocalizedText(item.title),
            documentUrl: readHttpUrl(item.fileUrl) || readHttpUrl(item.documentUrl) || '#',
          }
        })
      : undefined,
    cases: readArray(source.cases).length
      ? readArray(source.cases).map((memberCase, index) => {
          const item = isRecord(memberCase) ? memberCase : {}
          return {
            id: readStringOr(item.id, `case-${memberId}-${index}`),
            title: readLocalizedText(item.title),
            description: readLocalizedText(item.description),
            imageUrl: readStringOr(item.imageUrl, '') || undefined,
          }
        })
      : undefined,
    products: readArray(source.products).length
      ? readArray(source.products).map((product, index) => {
          const item = isRecord(product) ? product : {}
          return {
            id: readStringOr(item.id, `prod-${memberId}-${index}`),
            name: readLocalizedText(item.name),
            description: readLocalizedText(item.description),
            imageUrl: readStringOr(item.imageUrl, '') || undefined,
            price: readString(item.price),
          }
        })
      : undefined,
    lastUpdated: readString(source.lastUpdated) || readString(source._updatedAt)?.slice(0, 10),
    internalNotes: undefined,
  }
}

/** Async loader: public content API; DEV may fall back to seed if API is down. */
export async function fetchMembers(): Promise<AssociationMember[]> {
  try {
    const docs = await fetchContentItems<unknown>('members')
    return docs.map(mapMember)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Content API fetchMembers unavailable in DEV, using seed:', err)
      return INITIAL_MEMBERS
    }
    if (err instanceof ContentApiError) throw err
    throw new ContentApiError('Failed to load members', 500)
  }
}
