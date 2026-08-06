/**
 * Канонічний production-origin для статичних SEO-файлів (`robots.txt`, `sitemap.xml`,
 * fallback OG в `index.html`). У рантаймі клієнтські meta беруть `window.location.origin`,
 * щоб preview/localhost не підміняли прод.
 *
 * Має збігатися з production `SITE_URL` на Vercel (без trailing slash).
 */
export const PUBLIC_SITE_ORIGIN = 'https://uaos.space'

/** Дефолтний OG/Twitter image, коли сторінка не передає власний. */
export const DEFAULT_OG_IMAGE_PATH = '/images/hero_1.png'
