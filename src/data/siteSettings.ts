import {LocalizedText} from '../types'
import {ContentApiError, fetchContentItem} from '../lib/contentApi'
import {isRecord, readLocalizedText, readStringOr} from '../lib/contentGuards'

export interface SiteSettings {
  phone: string
  email: string
  address: LocalizedText
  brandTagline: LocalizedText
  statsShowOnSite: boolean
  statsMembersValue: string
  statsProducersValue: string
  statsProjectsValue: string
  statsYearsValue: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phone: '+38 067 585 9110',
  email: 'uaos24h@gmail.com',
  address: {
    uk: '04119, Україна, м. Київ, вул. Юрія Іллєнка, 83д',
    en: '04119, Ukraine, Kyiv, Yuria Illienka street, 83d',
    de: '04119, Ukraine, Kyjiw, Jurij-Illjenko-Straße 83d',
    es: '04119, Ucrania, Kyiv, calle Yuriya Illienka, 83d',
    kk: '04119, Украина, Киев қ., Юрий Илленко көшесі, 83д',
    fr: '04119, Ukraine, Kyiv, rue Yuriya Illienka, 83d',
  },
  brandTagline: {
    uk: 'Українська Асоціація Професійної Безпеки',
    en: 'Ukrainian Association of Occupational Safety',
    de: 'Ukrainischer Verband für Arbeitssicherheit',
    es: 'Asociación Ucraniana de Seguridad Laboral',
    kk: 'Украина Кәсіптік Қауіпсіздік Қауымдастығы',
    fr: 'Association ukrainienne de la sécurité au travail',
  },
  statsShowOnSite: false,
  statsMembersValue: '125',
  statsProducersValue: '68',
  statsProjectsValue: '320+',
  statsYearsValue: '12',
}

function readStats(source: Record<string, unknown>): Pick<
  SiteSettings,
  | 'statsShowOnSite'
  | 'statsMembersValue'
  | 'statsProducersValue'
  | 'statsProjectsValue'
  | 'statsYearsValue'
> {
  return {
    statsShowOnSite: Boolean(source.statsShowOnSite),
    statsMembersValue: readStringOr(source.statsMembersValue, DEFAULT_SITE_SETTINGS.statsMembersValue),
    statsProducersValue: readStringOr(
      source.statsProducersValue,
      DEFAULT_SITE_SETTINGS.statsProducersValue,
    ),
    statsProjectsValue: readStringOr(
      source.statsProjectsValue,
      DEFAULT_SITE_SETTINGS.statsProjectsValue,
    ),
    statsYearsValue: readStringOr(source.statsYearsValue, DEFAULT_SITE_SETTINGS.statsYearsValue),
  }
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
      ...readStats(source),
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
