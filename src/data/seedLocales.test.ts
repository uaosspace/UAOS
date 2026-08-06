import {describe, expect, it} from 'vitest'
import {ACTIVITY_DIRECTIONS} from './activityDirections'
import {INITIAL_DOCUMENTS} from './documents'
import {INITIAL_EVENTS} from './events'
import {LOCALES} from './locales'
import {INITIAL_MEMBERS} from './members'
import {INITIAL_NEWS} from './news'
import {COMPETENCY_AREAS, PARTICIPANT_TYPES, PRODUCT_CATEGORIES, SECTORS} from './referenceLists'
import {DEFAULT_SITE_SETTINGS} from './siteSettings'

function isLocalizedText(value: object): boolean {
  return 'uk' in value && 'en' in value && typeof Reflect.get(value, 'uk') === 'string'
}

/** Walks arbitrary seed structures and reports paths of LocalizedText objects missing a locale. */
function findGaps(root: unknown, rootPath: string): string[] {
  const gaps: string[] = []
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (typeof value !== 'object' || value === null) return

    if (isLocalizedText(value)) {
      for (const locale of LOCALES) {
        const text = Reflect.get(value, locale)
        if (typeof text !== 'string' || text.trim() === '') gaps.push(`${path}.${locale}`)
      }
      return
    }
    for (const [key, nested] of Object.entries(value)) visit(nested, `${path}.${key}`)
  }
  visit(root, rootPath)
  return gaps
}

describe('Seed content locale coverage', () => {
  const sources: Array<[string, unknown]> = [
    ['INITIAL_MEMBERS', INITIAL_MEMBERS],
    ['ACTIVITY_DIRECTIONS', ACTIVITY_DIRECTIONS],
    ['PARTICIPANT_TYPES', PARTICIPANT_TYPES],
    ['SECTORS', SECTORS],
    ['PRODUCT_CATEGORIES', PRODUCT_CATEGORIES],
    ['COMPETENCY_AREAS', COMPETENCY_AREAS],
    ['INITIAL_DOCUMENTS', INITIAL_DOCUMENTS],
    ['INITIAL_NEWS', INITIAL_NEWS],
    ['INITIAL_EVENTS', INITIAL_EVENTS],
    ['DEFAULT_SITE_SETTINGS', DEFAULT_SITE_SETTINGS],
  ]

  it.each(sources)('%s covers every supported locale', (name, source) => {
    expect(findGaps(source, name)).toEqual([])
  })
})
