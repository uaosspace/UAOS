import type {LocalizedText} from './shared'

export type DocumentAccessLevel = 'public' | 'member' | 'internal'

export interface DocumentItem {
  id: string
  title: LocalizedText
  description: LocalizedText
  type: 'pdf' | 'doc' | 'link'
  size?: string
  language: 'UA' | 'EN' | 'UA/EN'
  dateUpdated: string
  fileUrl: string
  /** Рівень доступу до документа/матеріалу (розділ 16 ТЗ); публічний UI показує лише 'public'. */
  accessLevel: DocumentAccessLevel
}
