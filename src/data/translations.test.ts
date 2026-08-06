import {describe, expect, it} from 'vitest'
import {LOCALES} from './locales'
import {TRANSLATIONS} from './translations'

/**
 * Неповний locale-блок компілятор ловить лише там, де зниклий ключ реально використовується:
 * для невживаного ключа TranslationKey просто звужується. Тому набір ключів перевіряємо явно.
 */
describe('TRANSLATIONS', () => {
  const referenceKeys = Object.keys(TRANSLATIONS.uk).sort()

  it('exposes the same key set for every locale', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(TRANSLATIONS[locale]).sort(), locale).toEqual(referenceKeys)
    }
  })

  it('has no empty UI string in any locale', () => {
    for (const locale of LOCALES) {
      const empty = referenceKeys.filter((key) => TRANSLATIONS[locale][key as never] === '')
      expect(empty, locale).toEqual([])
    }
  })

  it('keeps seven weekday abbreviations per locale', () => {
    for (const locale of LOCALES) {
      expect(TRANSLATIONS[locale].events_weekdays_short.split(','), locale).toHaveLength(7)
    }
  })
})
