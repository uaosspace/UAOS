import {describe, expect, it} from 'vitest'
import {
  composeJoinPhone,
  defaultPhoneDialForLocale,
  normalizeNationalPhone,
  phoneCountryCodesCoverLocales,
} from './phoneCountryCodes'

describe('phoneCountryCodes', () => {
  it('covers every site locale', () => {
    expect(phoneCountryCodesCoverLocales()).toBe(true)
  })

  it('defaults dial by UI locale', () => {
    expect(defaultPhoneDialForLocale('uk')).toBe('+380')
    expect(defaultPhoneDialForLocale('en')).toBe('+44')
  })

  it('strips national trunk zero and non-digits', () => {
    expect(normalizeNationalPhone('067 585 9110')).toBe('675859110')
    expect(normalizeNationalPhone('020 7946 0958')).toBe('2079460958')
  })

  it('composes full phone', () => {
    expect(composeJoinPhone('+380', '0675859110')).toBe('+380675859110')
    expect(composeJoinPhone('+44', '20 7946 0958')).toBe('+442079460958')
  })
})
