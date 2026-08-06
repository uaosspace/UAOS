import {describe, expect, it} from 'vitest'
import {
  PRIVACY_POLICY_VERSION,
  isPrivacyNoticeLanguage,
  resolveNoticeLanguage,
} from './privacyPolicy'

describe('privacyPolicy metadata', () => {
  it('publishes a concrete policy version stamped into consents by default', () => {
    expect(PRIVACY_POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accepts only languages that have a published policy text', () => {
    expect(isPrivacyNoticeLanguage('uk')).toBe(true)
    expect(isPrivacyNoticeLanguage('en')).toBe(true)
    expect(isPrivacyNoticeLanguage('de')).toBe(false)
    expect(isPrivacyNoticeLanguage('')).toBe(false)
    expect(isPrivacyNoticeLanguage(null)).toBe(false)
  })

  it('maps UI locales to the language of the notice the user actually sees', () => {
    expect(resolveNoticeLanguage('uk')).toBe('uk')
    expect(resolveNoticeLanguage('en')).toBe('en')
    expect(resolveNoticeLanguage('de')).toBe('en')
    expect(resolveNoticeLanguage('fr')).toBe('en')
  })
})
