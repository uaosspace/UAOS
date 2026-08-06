import {describe, expect, it} from 'vitest'
import {MEMBERSHIP_TERMS_PURPOSE, SITE_TERMS_VERSION} from './siteTerms'

describe('siteTerms metadata', () => {
  it('publishes a concrete draft terms version for the consent trail', () => {
    expect(SITE_TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}/)
    expect(SITE_TERMS_VERSION).toContain('draft')
  })

  it('uses a stable purpose code for the second join-form confirmation', () => {
    expect(MEMBERSHIP_TERMS_PURPOSE).toBe('membership_terms')
  })
})
