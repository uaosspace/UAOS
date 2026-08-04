import {describe, expect, it} from 'vitest'
import {
  clampOptionalText,
  normalizeOptionalHttpUrl,
  normalizeOptionalPublicEmail,
  normalizeOptionalPublicPhone,
  requireNonEmptyText,
} from './contentValidation'

describe('contentValidation', () => {
  it('accepts safe http(s) urls and rejects others', () => {
    expect(normalizeOptionalHttpUrl('https://example.com/a', 'websiteUrl')).toBe(
      'https://example.com/a',
    )
    expect(normalizeOptionalHttpUrl('', 'websiteUrl')).toBe('')
    expect(() => normalizeOptionalHttpUrl('javascript:alert(1)', 'websiteUrl')).toThrow(/http/)
    expect(() => normalizeOptionalHttpUrl('https://user:pass@evil.test', 'logoUrl')).toThrow(
      /credentials/,
    )
  })

  it('requires non-empty text within limits', () => {
    expect(requireNonEmptyText('  Acme  ', 'name.uk')).toBe('Acme')
    expect(() => requireNonEmptyText('   ', 'name.uk')).toThrow(/required/)
    expect(() => clampOptionalText('x'.repeat(10), 5)).toThrow(/too long/)
  })

  it('validates optional public contacts without accepting junk', () => {
    expect(normalizeOptionalPublicEmail('Info@Example.COM')).toBe('info@example.com')
    expect(() => normalizeOptionalPublicEmail('not-an-email')).toThrow(/invalid/)
    expect(normalizeOptionalPublicPhone('+380 67 123-45-67')).toBe('+380 67 123-45-67')
    expect(() => normalizeOptionalPublicPhone('abc')).toThrow(/invalid/)
  })
})
