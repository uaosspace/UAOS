import {createClient, type SanityClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || 'production'

export const sanityConfigured = Boolean(
  projectId && projectId !== 'yourProjectId' && projectId.length > 0
)

export const sanityStudioUrl =
  (import.meta.env.VITE_SANITY_STUDIO_URL as string | undefined) || 'http://localhost:3333'

let client: SanityClient | null = null

type ImagePreset =
  | 'default'
  | 'memberLogo'
  | 'memberCover'
  | 'memberCase'
  | 'memberProduct'
  | 'newsCover'
  | 'eventCover'

const IMAGE_PRESETS: Record<ImagePreset, {width: number; height?: number; fit?: 'crop' | 'clip'}> = {
  default: {width: 1200},
  memberLogo: {width: 320, height: 320, fit: 'clip'},
  memberCover: {width: 1400, height: 788, fit: 'crop'},
  memberCase: {width: 960, height: 720, fit: 'crop'},
  memberProduct: {width: 800, height: 600, fit: 'crop'},
  newsCover: {width: 960, height: 540, fit: 'crop'},
  eventCover: {width: 1200, height: 675, fit: 'crop'},
}

export function getSanityClient(): SanityClient | null {
  if (!sanityConfigured) return null
  if (!client) {
    client = createClient({
      projectId: projectId!,
      dataset,
      apiVersion: '2025-01-01',
      useCdn: true,
    })
  }
  return client
}

/**
 * Строит URL изображения Sanity по заранее оговорённому пресету размеров.
 */
export function urlForImage(source: unknown, preset: ImagePreset = 'default'): string {
  if (!source || !sanityConfigured) return ''
  const c = getSanityClient()
  if (!c) return ''
  try {
    const config = IMAGE_PRESETS[preset]
    let builder = imageUrlBuilder(c).image(source as any).width(config.width).auto('format')
    if (config.height) builder = builder.height(config.height)
    if (config.fit) builder = builder.fit(config.fit)
    return builder.url()
  } catch {
    return ''
  }
}

export type SanityLocale = {uk?: string; en?: string} | null | undefined

export function mapLocale(value: SanityLocale): {uk: string; en: string} {
  return {
    uk: value?.uk?.trim() || '',
    en: value?.en?.trim() || '',
  }
}
