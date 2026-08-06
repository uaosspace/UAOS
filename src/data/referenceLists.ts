import type {LocalizedText} from '../types'

export interface ReferenceListItem {
  id: string
  label: LocalizedText
}

/**
 * Типи учасників асоціації — використовуються каталогом учасників, блоком
 * «Для кого створена UAOS» на головній та формою заявки на вступ (розділ 16 ТЗ).
 */
export const PARTICIPANT_TYPES: ReferenceListItem[] = [
  {
    id: 'producer-supplier',
    label: {
      uk: 'Виробники та постачальники',
      en: 'Producers and suppliers',
      de: 'Hersteller und Lieferanten',
      es: 'Fabricantes y proveedores',
      kk: 'Өндірушілер мен жеткізушілер',
      fr: 'Fabricants et fournisseurs',
    },
  },
  {
    id: 'consumer-enterprise',
    label: {
      uk: 'Підприємства-споживачі',
      en: 'Consumer enterprises',
      de: 'Anwenderunternehmen',
      es: 'Empresas usuarias',
      kk: 'Тұтынушы кәсіпорындар',
      fr: 'Entreprises utilisatrices',
    },
  },
  {
    id: 'expert-org',
    label: {
      uk: 'Експерти та професійні організації',
      en: 'Experts and professional organizations',
      de: 'Experten und Fachorganisationen',
      es: 'Expertos y organizaciones profesionales',
      kk: 'Сарапшылар және кәсіби ұйымдар',
      fr: 'Experts et organisations professionnelles',
    },
  },
  {
    id: 'other',
    label: {
      uk: 'Інше',
      en: 'Other',
      de: 'Sonstiges',
      es: 'Otro',
      kk: 'Басқа',
      fr: 'Autre',
    },
  },
]

/** Галузеві сектори підприємств-споживачів та виробників. */
export const SECTORS: ReferenceListItem[] = [
  {
    id: 'manufacturing',
    label: {
      uk: 'Промислове виробництво',
      en: 'Manufacturing',
      de: 'Industrielle Fertigung',
      es: 'Producción industrial',
      kk: 'Өнеркәсіптік өндіріс',
      fr: 'Production industrielle',
    },
  },
  {
    id: 'construction',
    label: {
      uk: 'Будівництво',
      en: 'Construction',
      de: 'Bauwesen',
      es: 'Construcción',
      kk: 'Құрылыс',
      fr: 'Construction',
    },
  },
  {
    id: 'logistics',
    label: {
      uk: 'Логістика та транспорт',
      en: 'Logistics and transport',
      de: 'Logistik und Transport',
      es: 'Logística y transporte',
      kk: 'Логистика және көлік',
      fr: 'Logistique et transport',
    },
  },
  {
    id: 'energy',
    label: {
      uk: 'Енергетика',
      en: 'Energy',
      de: 'Energiewirtschaft',
      es: 'Energía',
      kk: 'Энергетика',
      fr: 'Énergie',
    },
  },
  {
    id: 'metallurgy',
    label: {
      uk: 'Металургія та гірничодобувна галузь',
      en: 'Metallurgy and mining',
      de: 'Metallurgie und Bergbau',
      es: 'Metalurgia y minería',
      kk: 'Металлургия және тау-кен өнеркәсібі',
      fr: 'Métallurgie et industrie minière',
    },
  },
  {
    id: 'agriculture',
    label: {
      uk: 'Агропромисловий комплекс',
      en: 'Agriculture',
      de: 'Agrar- und Lebensmittelwirtschaft',
      es: 'Sector agroindustrial',
      kk: 'Агроөнеркәсіптік кешен',
      fr: 'Secteur agroalimentaire',
    },
  },
  {
    id: 'retail',
    label: {
      uk: 'Роздрібна торгівля',
      en: 'Retail',
      de: 'Einzelhandel',
      es: 'Comercio minorista',
      kk: 'Бөлшек сауда',
      fr: 'Commerce de détail',
    },
  },
  {
    id: 'other-sector',
    label: {
      uk: 'Інша галузь',
      en: 'Other sector',
      de: 'Andere Branche',
      es: 'Otro sector',
      kk: 'Басқа сала',
      fr: 'Autre secteur',
    },
  },
]

/** Категорії продукції/послуг для виробників і постачальників. */
export const PRODUCT_CATEGORIES: ReferenceListItem[] = [
  {
    id: 'ppe-clothing',
    label: {
      uk: 'Спецодяг і захисний одяг',
      en: 'Workwear and protective clothing',
      de: 'Arbeits- und Schutzkleidung',
      es: 'Ropa de trabajo y ropa de protección',
      kk: 'Арнайы киім және қорғаныш киім',
      fr: 'Vêtements de travail et de protection',
    },
  },
  {
    id: 'ppe-footwear',
    label: {
      uk: 'Спецвзуття',
      en: 'Safety footwear',
      de: 'Sicherheitsschuhe',
      es: 'Calzado de seguridad',
      kk: 'Арнайы аяқ киім',
      fr: 'Chaussures de sécurité',
    },
  },
  {
    id: 'ppe-head-eye-ear',
    label: {
      uk: 'Захист голови, очей і слуху',
      en: 'Head, eye and hearing protection',
      de: 'Kopf-, Augen- und Gehörschutz',
      es: 'Protección de cabeza, ojos y oídos',
      kk: 'Бас, көз және есту мүшелерін қорғау',
      fr: 'Protection de la tête, des yeux et de l’ouïe',
    },
  },
  {
    id: 'ppe-hand',
    label: {
      uk: 'Захист рук',
      en: 'Hand protection',
      de: 'Handschutz',
      es: 'Protección de las manos',
      kk: 'Қолды қорғау',
      fr: 'Protection des mains',
    },
  },
  {
    id: 'ppe-respiratory',
    label: {
      uk: 'Засоби захисту органів дихання',
      en: 'Respiratory protection',
      de: 'Atemschutz',
      es: 'Protección respiratoria',
      kk: 'Тыныс алу мүшелерін қорғау құралдары',
      fr: 'Protection respiratoire',
    },
  },
  {
    id: 'height-safety',
    label: {
      uk: 'Системи безпеки для робіт на висоті',
      en: 'Fall protection systems',
      de: 'Absturzsicherung für Höhenarbeiten',
      es: 'Sistemas de protección contra caídas para trabajos en altura',
      kk: 'Биіктегі жұмыстарға арналған қауіпсіздік жүйелері',
      fr: 'Systèmes de protection antichute pour les travaux en hauteur',
    },
  },
  {
    id: 'training-services',
    label: {
      uk: 'Навчальні та консультаційні послуги',
      en: 'Training and consulting services',
      de: 'Schulungs- und Beratungsleistungen',
      es: 'Servicios de formación y consultoría',
      kk: 'Оқыту және консультациялық қызметтер',
      fr: 'Services de formation et de conseil',
    },
  },
  {
    id: 'other-product',
    label: {
      uk: 'Інша категорія',
      en: 'Other category',
      de: 'Andere Kategorie',
      es: 'Otra categoría',
      kk: 'Басқа санат',
      fr: 'Autre catégorie',
    },
  },
]

/** Компетенції експертів і професійних організацій. */
export const COMPETENCY_AREAS: ReferenceListItem[] = [
  {
    id: 'occupational-safety',
    label: {
      uk: 'Охорона праці',
      en: 'Occupational safety',
      de: 'Arbeitssicherheit',
      es: 'Seguridad laboral',
      kk: 'Еңбек қауіпсіздігі',
      fr: 'Sécurité au travail',
    },
  },
  {
    id: 'certification',
    label: {
      uk: 'Стандартизація та сертифікація',
      en: 'Standardization and certification',
      de: 'Normung und Zertifizierung',
      es: 'Normalización y certificación',
      kk: 'Стандарттау және сертификаттау',
      fr: 'Normalisation et certification',
    },
  },
  {
    id: 'training-expertise',
    label: {
      uk: 'Навчання та підвищення кваліфікації',
      en: 'Training and qualification',
      de: 'Schulung und Weiterbildung',
      es: 'Formación y perfeccionamiento profesional',
      kk: 'Оқыту және біліктілікті арттыру',
      fr: 'Formation et perfectionnement',
    },
  },
  {
    id: 'risk-audit',
    label: {
      uk: 'Аудит ризиків і робочих місць',
      en: 'Risk and workplace audit',
      de: 'Risiko- und Arbeitsplatzbeurteilung',
      es: 'Auditoría de riesgos y puestos de trabajo',
      kk: 'Тәуекелдер мен жұмыс орындарын аудиттеу',
      fr: 'Audit des risques et des postes de travail',
    },
  },
  {
    id: 'legal-regulatory',
    label: {
      uk: 'Правове та нормативне забезпечення',
      en: 'Legal and regulatory support',
      de: 'Rechtliche und normative Unterstützung',
      es: 'Apoyo jurídico y normativo',
      kk: 'Құқықтық және нормативтік қамтамасыз ету',
      fr: 'Accompagnement juridique et réglementaire',
    },
  },
  {
    id: 'other-competency',
    label: {
      uk: 'Інша компетенція',
      en: 'Other competency',
      de: 'Andere Kompetenz',
      es: 'Otra competencia',
      kk: 'Басқа құзырет',
      fr: 'Autre compétence',
    },
  },
]
