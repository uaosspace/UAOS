import type {ApplicantKind} from '../types'

export interface JoinRequestSubmission {
  companyName: string
  website: string
  activityField: string
  contactPerson: string
  email: string
  phone: string
  message: string
  edrpou: string
  hp?: string
  turnstileToken?: string
  /** Опціональна класифікація заявника (розділ 12/16 ТЗ). */
  applicantKind?: ApplicantKind
  sectors?: string[]
  productCategories?: string[]
  competencies?: string[]
}

/**
 * Отправляет заявку на вступление через единый API-адаптер.
 */
export async function submitJoinRequest(payload: JoinRequestSubmission): Promise<void> {
  const response = await fetch('/api/join', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      ...payload,
      privacyConsent: true,
      consent: true,
      hp: payload.hp ?? '',
      turnstileToken: payload.turnstileToken ?? '',
    }),
  })

  if (response.ok) return

  const errorData = await response.json().catch(() => null)
  throw new Error(
    typeof errorData?.error === 'string' && errorData.error
      ? errorData.error
      : 'Join request failed'
  )
}
