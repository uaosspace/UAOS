/**
 * Build a URL-safe slug from Ukrainian/Latin titles for admin content.
 * Keeps existing latin slugs; transliterates Cyrillic letters commonly used in UA titles.
 */
const CYR_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
  ы: 'y',
  э: 'e',
  ъ: '',
}

export function slugifyTitle(input: string): string {
  const raw = input.trim().toLowerCase()
  if (!raw) return ''

  let out = ''
  for (const char of raw) {
    if (CYR_TO_LAT[char] !== undefined) {
      out += CYR_TO_LAT[char]
      continue
    }
    if (/[a-z0-9]/.test(char)) {
      out += char
      continue
    }
    if (/\s|_/.test(char) || char === '-' || char === '—') {
      out += '-'
      continue
    }
    // drop punctuation and other symbols
  }

  return out
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Prefer explicit slug; otherwise generate from title; last resort: timed id. */
export function resolveContentSlug(explicitSlug: string, titleUk: string, fallbackPrefix = 'item'): string {
  const fromExplicit = slugifyTitle(explicitSlug)
  if (fromExplicit) return fromExplicit
  const fromTitle = slugifyTitle(titleUk)
  if (fromTitle) return fromTitle
  return `${fallbackPrefix}-${Date.now().toString(36)}`
}
