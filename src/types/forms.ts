export type ApplicantKind = 'producer-supplier' | 'consumer-enterprise' | 'expert-org' | 'other'

export interface JoinRequest {
  id: string
  companyName: string
  website: string
  activityField: string
  contactPerson: string
  email: string
  phone: string
  message: string
  edrpou?: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'rejected' | 'accepted'
  /** Опціональні поля розширеної класифікації заявника (розділ 12/16 ТЗ). */
  applicantKind?: ApplicantKind
  sectors?: string[]
  productCategories?: string[]
  competencies?: string[]
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
  status: 'new' | 'read'
}
