import {describe, expect, it} from 'vitest'
import {
  normalizeJoinApplication,
  normalizeJoinWebsite,
  validateJoinApplication,
} from './joinApplication.js'

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
        termsConsent: true,
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

  it('normalizes optional classification fields', () => {
    const payload = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      privacyConsent: true,
      termsConsent: true,
      applicantKind: 'producer-supplier',
      sectors: ['manufacturing', 'construction'],
      productCategories: ['ppe-clothing'],
      competencies: [],
    })

    expect(payload.applicantKind).toBe('producer-supplier')
    expect(payload.sectors).toEqual(['manufacturing', 'construction'])
    expect(payload.productCategories).toEqual(['ppe-clothing'])
    expect(payload.competencies).toEqual([])
    expect(validateJoinApplication(payload)).toBeNull()
  })

  it('falls back to empty applicantKind for invalid or missing values', () => {
    const payload = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      privacyConsent: true,
      termsConsent: true,
      applicantKind: 'not-a-real-kind',
    })

    expect(payload.applicantKind).toBe('')
    expect(validateJoinApplication(payload)).toBeNull()
  })

  it('requires privacy and terms consent on the server', () => {
    const withoutPrivacy = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      termsConsent: true,
    })
    expect(validateJoinApplication(withoutPrivacy)).toBe('Privacy consent is required')

    const withoutTerms = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      privacyConsent: true,
    })
    expect(validateJoinApplication(withoutTerms)).toBe('Terms consent is required')

    const both = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      privacyConsent: true,
      termsConsent: true,
    })
    expect(validateJoinApplication(both)).toBeNull()
    expect(both.termsConsentGiven).toBe(true)
  })

  it('records the notice language actually shown to the applicant', () => {
    const en = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      privacyConsent: true,
      noticeLanguage: 'en',
      termsConsent: true,
    })

    expect(en.noticeLanguage).toBe('en')
    expect(validateJoinApplication(en)).toBeNull()

    const uk = normalizeJoinApplication({noticeLanguage: 'uk', privacyConsent: true, termsConsent: true})
    expect(uk.noticeLanguage).toBe('uk')
  })

  it('falls back to uk notice language for missing or unsupported values', () => {
    expect(normalizeJoinApplication({}).noticeLanguage).toBe('uk')
    expect(normalizeJoinApplication({noticeLanguage: 'de'}).noticeLanguage).toBe('uk')
    expect(normalizeJoinApplication({noticeLanguage: 42}).noticeLanguage).toBe('uk')
  })

  it('caps classification arrays to a safe length and item size', () => {
    const longItem = 'x'.repeat(200)
    const payload = normalizeJoinApplication({
      companyName: 'ACME',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      privacyConsent: true,
      sectors: Array.from({length: 20}, (_, i) => `sector-${i}`),
      productCategories: [longItem],
    })

    expect(payload.sectors).toHaveLength(10)
    expect(payload.productCategories[0]?.length).toBeLessThanOrEqual(60)
  })
})
