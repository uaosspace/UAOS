import type {LocalizedText} from './shared'

export interface DocumentItem {
  id: string
  title: LocalizedText
  description: LocalizedText
  type: 'pdf' | 'doc' | 'link'
  size?: string
  language: 'UA' | 'EN' | 'UA/EN'
  dateUpdated: string
  fileUrl: string
}
