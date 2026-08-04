import {describe, expect, it} from 'vitest'
import {normalizeMediaUrl, shouldReleaseOwnedMedia} from './mediaCleanup'

describe('mediaCleanup policy', () => {
  it('normalizes blank cover urls', () => {
    expect(normalizeMediaUrl('  https://example.blob.vercel-storage.com/a.jpg  ')).toBe(
      'https://example.blob.vercel-storage.com/a.jpg',
    )
    expect(normalizeMediaUrl('')).toBe('')
  })

  it('releases only unused tracked assets', () => {
    expect(shouldReleaseOwnedMedia(false, 0)).toBe(false)
    expect(shouldReleaseOwnedMedia(true, 1)).toBe(false)
    expect(shouldReleaseOwnedMedia(true, 0)).toBe(true)
  })
})
