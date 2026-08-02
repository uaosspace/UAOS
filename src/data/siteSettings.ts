import {LocalizedText} from '../types'
import {getSanityClient, mapLocale, sanityConfigured} from '../lib/sanity'

export interface SiteSettings {
  phone: string
  email: string
  address: LocalizedText
  brandTagline: LocalizedText
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phone: '+38 067 585 9110',
  email: 'uaos24h@gmail.com',
  address: {
    uk: '04119, Україна, м. Київ, вул. Юрія Іллєнка, 83д',
    en: '04119, Ukraine, Kyiv, Yuria Illienka street, 83d',
  },
  brandTagline: {
    uk: 'Українська Асоціація Професійної Безпеки',
    en: 'Ukrainian Association of Occupational Safety',
  },
}

const SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  phone,
  email,
  address,
  brandTagline
}`

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const client = getSanityClient()
  if (!client || !sanityConfigured) {
    return DEFAULT_SITE_SETTINGS
  }
  try {
    const doc = await client.fetch(SETTINGS_QUERY)
    if (!doc) return DEFAULT_SITE_SETTINGS
    return {
      phone: doc.phone || DEFAULT_SITE_SETTINGS.phone,
      email: doc.email || DEFAULT_SITE_SETTINGS.email,
      address: doc.address ? mapLocale(doc.address) : DEFAULT_SITE_SETTINGS.address,
      brandTagline: doc.brandTagline
        ? mapLocale(doc.brandTagline)
        : DEFAULT_SITE_SETTINGS.brandTagline,
    }
  } catch (err) {
    console.error('Sanity fetchSiteSettings failed:', err)
    return DEFAULT_SITE_SETTINGS
  }
}
