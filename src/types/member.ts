import type {LocalizedText} from './shared'

export type MemberProfileLevel = 'basic' | 'extended'

export interface MemberProduct {
  id: string
  name: LocalizedText
  description: LocalizedText
  imageUrl?: string
  price?: string
}

export interface MemberCase {
  id: string
  title: LocalizedText
  description: LocalizedText
  imageUrl?: string
}

export interface MemberCertificate {
  id: string
  title: LocalizedText
  documentUrl: string
}

export interface AssociationMember {
  id: string
  slug: string
  order: number
  published: boolean
  profileLevel: MemberProfileLevel
  name: LocalizedText
  shortName: string
  category: LocalizedText
  shortDescription: LocalizedText
  fullDescription: LocalizedText
  logoUrl: string
  coverImageUrl: string
  websiteUrl?: string
  publicEmail?: string
  publicPhone?: string
  competencies?: LocalizedText[]
  services?: LocalizedText[]
  certificates?: MemberCertificate[]
  cases?: MemberCase[]
  products?: MemberProduct[]
  lastUpdated?: string
  internalNotes?: string
  /** Ідентифікатори з PARTICIPANT_TYPES (src/data/referenceLists.ts). */
  participantTypes: string[]
  /** Ідентифікатори з SECTORS. */
  sectors?: string[]
  /** Ідентифікатори з PRODUCT_CATEGORIES. */
  productCategories?: string[]
  region?: string
  featured?: boolean
}
