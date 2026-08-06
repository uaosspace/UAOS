import {DEFAULT_OG_IMAGE_PATH} from './siteOrigin'

/**
 * Будує canonical URL без query/hash: origin + нормалізований pathname.
 * Кінцевий `/` знімається, крім кореня.
 */
export function buildCanonicalUrl(origin: string, pathname: string): string {
  const base = origin.replace(/\/$/, '')
  const raw = pathname && pathname.length > 0 ? pathname : '/'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  const normalized =
    withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
  return `${base}${normalized}`
}

/** Абсолютний URL для asset або вже абсолютного http(s)-посилання. */
export function absoluteAssetUrl(origin: string, assetPath: string): string {
  const trimmed = assetPath.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const base = origin.replace(/\/$/, '')
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}

/** Image для OG/Twitter: явний шлях сторінки або дефолтний hero. */
export function resolveShareImageUrl(origin: string, ogImage?: string): string {
  return absoluteAssetUrl(origin, ogImage && ogImage.trim() ? ogImage : DEFAULT_OG_IMAGE_PATH)
}
