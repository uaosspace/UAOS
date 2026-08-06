import {describe, expect, it} from 'vitest'
import {absoluteAssetUrl, buildCanonicalUrl, resolveShareImageUrl} from './documentMeta'
import {DEFAULT_OG_IMAGE_PATH} from './siteOrigin'

describe('documentMeta helpers', () => {
  it('builds canonical URLs without query/hash noise and trailing slash', () => {
    expect(buildCanonicalUrl('https://uaos.space', '/')).toBe('https://uaos.space/')
    expect(buildCanonicalUrl('https://uaos.space/', '/en/news/')).toBe('https://uaos.space/en/news')
    expect(buildCanonicalUrl('https://uaos.space', 'members/acme')).toBe('https://uaos.space/members/acme')
  })

  it('absolutizes relative assets and keeps absolute ones', () => {
    expect(absoluteAssetUrl('https://uaos.space', '/images/hero_1.png')).toBe(
      'https://uaos.space/images/hero_1.png',
    )
    expect(absoluteAssetUrl('https://uaos.space/', 'https://cdn.example/a.png')).toBe(
      'https://cdn.example/a.png',
    )
  })

  it('falls back to the default share image when ogImage is empty', () => {
    expect(resolveShareImageUrl('https://uaos.space', undefined)).toBe(
      `https://uaos.space${DEFAULT_OG_IMAGE_PATH}`,
    )
    expect(resolveShareImageUrl('https://uaos.space', '   ')).toBe(
      `https://uaos.space${DEFAULT_OG_IMAGE_PATH}`,
    )
    expect(resolveShareImageUrl('https://uaos.space', '/members/logo.png')).toBe(
      'https://uaos.space/members/logo.png',
    )
  })
})
