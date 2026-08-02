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
