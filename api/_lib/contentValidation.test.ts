import {describe, expect, it} from 'vitest'
import {
  clampOptionalText,
  normalizeLocalizedText,
  normalizeOptionalHttpUrl,
  normalizeOptionalMediaUrl,
  normalizeOptionalPublicEmail,
  normalizeOptionalPublicPhone,
  normalizeParticipationMode,
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

  it('accepts site-relative media paths used by seeded member logos', () => {
    expect(normalizeOptionalMediaUrl('/members/effetex.png?v=2', 'logoUrl')).toBe(
      '/members/effetex.png?v=2',
    )
    expect(normalizeOptionalMediaUrl('https://cdn.example/a.png', 'coverImageUrl')).toBe(
      'https://cdn.example/a.png',
    )
    expect(() => normalizeOptionalMediaUrl('//cdn.example/a.png', 'logoUrl')).toThrow(/http/)
    expect(() => normalizeOptionalMediaUrl('/members/../secret.png', 'logoUrl')).toThrow(/media/)
  })

  it('requires non-empty text within limits', () => {
    expect(requireNonEmptyText('  Acme  ', 'name.uk')).toBe('Acme')
    expect(() => requireNonEmptyText('   ', 'name.uk')).toThrow(/required/)
    expect(() => clampOptionalText('x'.repeat(10), 5)).toThrow(/too long/)
  })

  it('keeps supported locales and drops empty or unknown ones', () => {
    expect(
      normalizeLocalizedText(
        {uk: ' Привіт ', en: 'Hello', de: 'Hallo', es: '   ', ru: 'Привет'},
        'title',
        100,
      ),
    ).toEqual({uk: 'Привіт', en: 'Hello', de: 'Hallo'})
    expect(normalizeLocalizedText(null, 'title', 100)).toEqual({})
    expect(normalizeLocalizedText('ACME', 'shortName', 100)).toEqual({uk: 'ACME'})
  })

  it('requires the default locale only when asked and limits each locale', () => {
    expect(() => normalizeLocalizedText({en: 'Hello'}, 'name', 100, {required: true})).toThrow(
      /name\.uk required/,
    )
    expect(normalizeLocalizedText({uk: 'Назва'}, 'name', 100, {required: true})).toEqual({
      uk: 'Назва',
    })
    expect(() => normalizeLocalizedText({uk: 'ok', kk: 'x'.repeat(11)}, 'name', 10)).toThrow(
      /name\.kk is too long/,
    )
  })

  it('validates optional public contacts without accepting junk', () => {
    expect(normalizeOptionalPublicEmail('Info@Example.COM')).toBe('info@example.com')
    expect(() => normalizeOptionalPublicEmail('not-an-email')).toThrow(/invalid/)
    expect(normalizeOptionalPublicPhone('+380 67 123-45-67')).toBe('+380 67 123-45-67')
    expect(() => normalizeOptionalPublicPhone('abc')).toThrow(/invalid/)
  })

  it('normalizes participation mode with offline default', () => {
    expect(normalizeParticipationMode('zoom')).toBe('zoom')
    expect(normalizeParticipationMode('online_link')).toBe('online_link')
    expect(normalizeParticipationMode(undefined)).toBe('offline')
    expect(normalizeParticipationMode('webex')).toBe('offline')
  })
})
