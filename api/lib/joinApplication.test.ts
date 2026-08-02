import {describe, expect, it} from 'vitest'
import {
  normalizeJoinApplication,
  normalizeJoinWebsite,
  validateJoinApplication,
} from './joinApplication'

describe('joinApplication helpers', () => {
  it('normalizes incoming fields', () => {
    const payload = normalizeJoinApplication({
      companyName: '  ACME   LLC ',
      activityField: '  PPE  ',
      contactPerson: '  Jane   Doe ',
      email: ' test@example.com ',
      phone: ' +380 67 000 00 00 ',
      edrpou: '12-34-56-78',
      privacyConsent: true,
    })

    expect(payload.companyName).toBe('ACME LLC')
    expect(payload.activityField).toBe('PPE')
    expect(payload.contactPerson).toBe('Jane Doe')
    expect(payload.edrpou).toBe('12345678')
  })

  it('validates required fields and consent', () => {
    const error = validateJoinApplication(
      normalizeJoinApplication({
        companyName: 'ACME',
        activityField: 'PPE',
        contactPerson: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+380670000000',
        privacyConsent: true,
      })
    )

    expect(error).toBeNull()
    expect(
      validateJoinApplication(
        normalizeJoinApplication({
          companyName: 'ACME',
        })
      )
    ).toBe('Missing required fields')
  })

  it('normalizes website for storage', () => {
    expect(normalizeJoinWebsite('https://example.com/path')).toBe('https://example.com/path')
  })
})
