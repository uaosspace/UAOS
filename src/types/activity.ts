import type {LocalizedText} from './shared'

export interface ActivityDirection {
  id: string
  /** Стабільний якір для /activity#anchor та посилань з інших сторінок. */
  anchor: string
  title: LocalizedText
  shortDescription: LocalizedText
  description: LocalizedText
  goals: LocalizedText[]
  formats: LocalizedText[]
  /** Ім'я SVG-іконки з набору SvgDefs (icon-*). */
  icon: string
  sortOrder: number
}
