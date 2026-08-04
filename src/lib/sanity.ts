/**
 * @deprecated Sanity client removed. Use src/lib/contentApi.ts.
 * This stub keeps accidental imports failing loudly at build time.
 */
export const sanityConfigured = false
export const sanityStudioUrl = ''

export function getSanityClient(): null {
  throw new Error('Sanity has been removed. Use /api/public content API.')
}

export function urlForImage(): string {
  return ''
}

export function mapLocale(value: {uk?: string; en?: string} | null | undefined): {uk: string; en: string} {
  return {uk: value?.uk?.trim() || '', en: value?.en?.trim() || ''}
}

export type SanityLocale = {uk?: string; en?: string} | null | undefined
