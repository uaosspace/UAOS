import {LocalizedText} from '../types'
import {ContentApiError, fetchContentItem} from '../lib/contentApi'
import {isRecord, readLocalizedText, readStringOr} from '../lib/contentGuards'

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

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const item = await fetchContentItem<unknown>('site-settings')
    const source = isRecord(item) ? item : {}
    return {
      phone: readStringOr(source.phone, DEFAULT_SITE_SETTINGS.phone),
      email: readStringOr(source.email, DEFAULT_SITE_SETTINGS.email),
      address: source.address
        ? readLocalizedText(source.address)
        : DEFAULT_SITE_SETTINGS.address,
      brandTagline: source.brandTagline
        ? readLocalizedText(source.brandTagline)
        : DEFAULT_SITE_SETTINGS.brandTagline,
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Content API fetchSiteSettings unavailable in DEV, using defaults:', err)
      return DEFAULT_SITE_SETTINGS
    }
    if (err instanceof ContentApiError) throw err
    throw new ContentApiError('Failed to load site settings', 500)
  }
}
