import {describe, expect, it} from 'vitest'
import {
  DEFAULT_SITE_SETTINGS,
  resolveSiteContacts,
  telHref,
} from './siteSettings'

describe('resolveSiteContacts', () => {
  it('returns phone/email as stored and address for locale', () => {
    const contacts = resolveSiteContacts(
      {
        ...DEFAULT_SITE_SETTINGS,
        phone: '+38 067 5432182',
        email: 'uaos.space@gmail.com',
        address: {
          ...DEFAULT_SITE_SETTINGS.address,
          uk: '04119, Україна, м. Київ, вул. Юрія Іллєнка, 83д',
          en: '04119, Ukraine, Kyiv, Illienka 83d',
        },
      },
      'uk',
    )
    expect(contacts.phone).toBe('+38 067 5432182')
    expect(contacts.email).toBe('uaos.space@gmail.com')
    expect(contacts.address).toContain('Іллєнка')
  })

  it('falls back address locale via resolveLocalized', () => {
    const contacts = resolveSiteContacts(
      {
        ...DEFAULT_SITE_SETTINGS,
        address: {
          uk: 'адреса UK',
          en: 'address EN',
        },
      },
      'de',
    )
    expect(contacts.address).toBe('address EN')
  })
})

describe('telHref', () => {
  it('strips spaces and punctuation for tel: links', () => {
    expect(telHref('+38 (044) 123-45-67')).toBe('tel:+380441234567')
  })
})
