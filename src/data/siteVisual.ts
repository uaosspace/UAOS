/**
 * Візуальні налаштування сайту (Industrial Neon).
 * Замініть heroImageUrl на шлях до реального фото — воно відобразиться справа в hero.
 */
export const SITE_VISUAL = {
  heroImageUrl: '/images/hero-default.webp',
} as const

export function heroImageCssValue(url: string = SITE_VISUAL.heroImageUrl): string {
  return `url("${url}")`
}
