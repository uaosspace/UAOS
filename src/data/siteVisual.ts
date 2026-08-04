/**
 * Візуальні налаштування сайту (Industrial Neon).
 * Hero-фото: чергування hero_1 / hero_2 (кросфейд на головній).
 */
export const SITE_VISUAL = {
  /** @deprecated використовуйте heroImageUrls[0] */
  heroImageUrl: '/images/hero_1.png',
  heroImageUrls: ['/images/hero_1.png', '/images/hero_2.png'] as const,
  /** Пауза між змінами кадру (без урахування fade). */
  heroRotateMs: 10_000,
  /** Тривалість кросфейду — має збігатися з CSS transition. */
  heroFadeMs: 1000,
} as const

export function heroImageCssValue(url: string = SITE_VISUAL.heroImageUrls[0]): string {
  return `url("${url}")`
}
