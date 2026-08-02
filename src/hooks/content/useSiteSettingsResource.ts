import {fetchSiteSettings, DEFAULT_SITE_SETTINGS} from '../../data/siteSettings'
import {useContentResource} from './useContentResource'

/**
 * Загружает глобальные настройки сайта, нужные всем верхнеуровневым экранам.
 */
export function useSiteSettingsResource(enabled = true) {
  return useContentResource(fetchSiteSettings, DEFAULT_SITE_SETTINGS, enabled)
}
