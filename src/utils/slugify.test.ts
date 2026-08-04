import {describe, expect, it} from 'vitest'
import {resolveContentSlug, slugifyTitle} from './slugify'

describe('slugifyTitle', () => {
  it('transliterates Ukrainian titles', () => {
    expect(slugifyTitle('ТЕСТОВА ПОДІЯ')).toBe('testova-podiya')
  })

  it('keeps latin and collapses separators', () => {
    expect(slugifyTitle('Safety Training 2026!')).toBe('safety-training-2026')
  })
})

describe('resolveContentSlug', () => {
  it('prefers existing slug', () => {
    expect(resolveContentSlug('already-set', 'Нова назва')).toBe('already-set')
  })

  it('builds from title when slug empty', () => {
    expect(resolveContentSlug('', 'ТЕСТОВА ПОДІЯ', 'event')).toBe('testova-podiya')
  })
})
