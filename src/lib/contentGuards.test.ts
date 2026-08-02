import {describe, expect, it} from 'vitest'
import {
  readDocumentLanguage,
  readDocumentType,
  readEventFormat,
  readEventType,
  readHttpUrl,
  readLocalizedText,
  readMemberProfileLevel,
} from './contentGuards'

describe('contentGuards', () => {
  it('normalizes localized text safely', () => {
    expect(readLocalizedText({uk: ' Привіт ', en: ' Hello '})).toEqual({
      uk: 'Привіт',
      en: 'Hello',
    })
    expect(readLocalizedText(null)).toEqual({uk: '', en: ''})
  })

  it('accepts only http urls', () => {
    expect(readHttpUrl('https://example.com/path')).toBe('https://example.com/path')
    expect(readHttpUrl('javascript:alert(1)')).toBeUndefined()
  })

  it('limits enum-like values to supported variants', () => {
    expect(readEventType('conference')).toBe('conference')
    expect(readEventType('other')).toBe('meeting')
    expect(readEventFormat('hybrid')).toBe('hybrid')
    expect(readEventFormat('stream')).toBe('online')
    expect(readMemberProfileLevel('extended')).toBe('extended')
    expect(readMemberProfileLevel('gold')).toBe('basic')
    expect(readDocumentType('link')).toBe('link')
    expect(readDocumentType('xls')).toBe('pdf')
    expect(readDocumentLanguage('UA/EN')).toBe('UA/EN')
    expect(readDocumentLanguage('DE')).toBe('UA')
  })
})
