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
    },
  },
  {
    id: 'consumer-enterprise',
    label: {
      uk: 'Підприємства-споживачі',
      en: 'Consumer enterprises',
    },
  },
  {
    id: 'expert-org',
    label: {
      uk: 'Експерти та професійні організації',
      en: 'Experts and professional organizations',
    },
  },
  {
    id: 'other',
    label: {
      uk: 'Інше',
      en: 'Other',
    },
  },
]

/** Галузеві сектори підприємств-споживачів та виробників. */
export const SECTORS: ReferenceListItem[] = [
  {id: 'manufacturing', label: {uk: 'Промислове виробництво', en: 'Manufacturing'}},
  {id: 'construction', label: {uk: 'Будівництво', en: 'Construction'}},
  {id: 'logistics', label: {uk: 'Логістика та транспорт', en: 'Logistics and transport'}},
  {id: 'energy', label: {uk: 'Енергетика', en: 'Energy'}},
  {id: 'metallurgy', label: {uk: 'Металургія та гірничодобувна галузь', en: 'Metallurgy and mining'}},
  {id: 'agriculture', label: {uk: 'Агропромисловий комплекс', en: 'Agriculture'}},
  {id: 'retail', label: {uk: 'Роздрібна торгівля', en: 'Retail'}},
  {id: 'other-sector', label: {uk: 'Інша галузь', en: 'Other sector'}},
]

/** Категорії продукції/послуг для виробників і постачальників. */
export const PRODUCT_CATEGORIES: ReferenceListItem[] = [
  {id: 'ppe-clothing', label: {uk: 'Спецодяг і захисний одяг', en: 'Workwear and protective clothing'}},
  {id: 'ppe-footwear', label: {uk: 'Спецвзуття', en: 'Safety footwear'}},
  {id: 'ppe-head-eye-ear', label: {uk: 'Захист голови, очей і слуху', en: 'Head, eye and hearing protection'}},
  {id: 'ppe-hand', label: {uk: 'Захист рук', en: 'Hand protection'}},
  {id: 'ppe-respiratory', label: {uk: 'Засоби захисту органів дихання', en: 'Respiratory protection'}},
  {id: 'height-safety', label: {uk: 'Системи безпеки для робіт на висоті', en: 'Fall protection systems'}},
  {id: 'training-services', label: {uk: 'Навчальні та консультаційні послуги', en: 'Training and consulting services'}},
  {id: 'other-product', label: {uk: 'Інша категорія', en: 'Other category'}},
]

/** Компетенції експертів і професійних організацій. */
export const COMPETENCY_AREAS: ReferenceListItem[] = [
  {id: 'occupational-safety', label: {uk: 'Охорона праці', en: 'Occupational safety'}},
  {id: 'certification', label: {uk: 'Стандартизація та сертифікація', en: 'Standardization and certification'}},
  {id: 'training-expertise', label: {uk: 'Навчання та підвищення кваліфікації', en: 'Training and qualification'}},
  {id: 'risk-audit', label: {uk: 'Аудит ризиків і робочих місць', en: 'Risk and workplace audit'}},
  {id: 'legal-regulatory', label: {uk: 'Правове та нормативне забезпечення', en: 'Legal and regulatory support'}},
  {id: 'other-competency', label: {uk: 'Інша компетенція', en: 'Other competency'}},
]
