import {describe, expect, it} from 'vitest'
import {fetchOgImageFromPageUrl} from './fetchOgImage'

describe('fetchOgImageFromPageUrl', () => {
  it('rejects non-http(s) and credentialed URLs', async () => {
    await expect(fetchOgImageFromPageUrl('ftp://example.com/a')).rejects.toThrow(/http/)
    await expect(fetchOgImageFromPageUrl('https://user:pass@example.com/a')).rejects.toThrow(
      /credentials/,
    )
  })

  it('rejects localhost / private hosts before fetch', async () => {
    await expect(fetchOgImageFromPageUrl('http://localhost/news')).rejects.toThrow(/not allowed/)
    await expect(fetchOgImageFromPageUrl('http://127.0.0.1/news')).rejects.toThrow(/not allowed/)
  })
})
