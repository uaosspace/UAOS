import type {OrderDraft, PaymentStatus} from '../../src/types'

export interface CreateCheckoutSessionInput {
  orderId: string
  productId: string
  memberId: string
  quantity: number
  customerEmail?: string
}

export interface CheckoutSessionDraft {
  sessionId: string
  status: PaymentStatus
  checkoutUrl?: string
}

/**
 * Описывает границу будущего checkout use case без привязки к конкретному провайдеру.
 */
export interface PaymentProviderAdapter {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionDraft>
}

/**
 * Нормализует черновик заказа для будущего платежного потока.
 */
export function buildOrderDraft(input: CreateCheckoutSessionInput): OrderDraft {
  return {
    id: input.orderId,
    productId: input.productId,
    memberId: input.memberId,
    quantity: input.quantity,
    status: 'draft',
  }
}
