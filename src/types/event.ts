import type {LocalizedText} from './shared'

export type EventType = 'training' | 'meeting' | 'conference'
export type EventFormat = 'online' | 'offline' | 'hybrid'

export interface AssociationEvent {
  id: string
  published: boolean
  title: LocalizedText
  shortDescription: LocalizedText
  fullDescription: LocalizedText
  type: EventType
  format: EventFormat
  startAt: string
  endAt: string
  timeZone: string
  location?: LocalizedText
  onlineUrl?: string
  registrationUrl?: string
  organizer?: LocalizedText
  coverImageUrl?: string
  createdAt: string
  updatedAt: string
}
