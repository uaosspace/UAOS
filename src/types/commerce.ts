import type {LocalizedText} from './shared'

export interface CatalogProduct {
  id: string
  memberId: string
  memberSlug: string
  memberShortName: string
  name: LocalizedText
  description: LocalizedText
  imageUrl?: string
  priceLabel?: string
}

export type PaymentStatus = 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled'

export interface OrderDraft {
  id: string
  productId: string
  memberId: string
  quantity: number
  totalLabel?: string
  status: PaymentStatus
}
