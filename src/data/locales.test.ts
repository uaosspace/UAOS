import {describe, expect, it} from 'vitest'
import {resolveLocalized} from './locales'

describe('resolveLocalized', () => {
  it('returns the requested locale when the field is translated', () => {
    const text = {uk: 'Привіт', en: 'Hello', de: 'Hallo', kk: 'Сәлем'}

    expect(resolveLocalized(text, 'uk')).toBe('Привіт')
    expect(resolveLocalized(text, 'en')).toBe('Hello')
    expect(resolveLocalized(text, 'de')).toBe('Hallo')
    expect(resolveLocalized(text, 'kk')).toBe('Сәлем')
  })

  it('falls back to English for an untranslated locale', () => {
    expect(resolveLocalized({uk: 'Привіт', en: 'Hello'}, 'es')).toBe('Hello')
  })

  it('falls back to Ukrainian when English is empty too', () => {
    expect(resolveLocalized({uk: 'Привіт', en: ''}, 'fr')).toBe('Привіт')
    expect(resolveLocalized({uk: 'Привіт', en: ''}, 'en')).toBe('Привіт')
  })
})
