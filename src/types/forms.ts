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
