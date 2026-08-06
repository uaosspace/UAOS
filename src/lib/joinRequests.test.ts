import {beforeEach, describe, expect, it, vi} from 'vitest'
import {submitJoinRequest} from './joinRequests'

describe('submitJoinRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the request to the join endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    await submitJoinRequest({
      companyName: 'ACME',
      website: '',
      activityField: 'PPE',
      contactPerson: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+380670000000',
      message: '',
      edrpou: '',
      noticeLanguage: 'en',
      termsConsent: true,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/join',
      expect.objectContaining({
        method: 'POST',
      })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.noticeLanguage).toBe('en')
    expect(body.privacyConsent).toBe(true)
    expect(body.termsConsent).toBe(true)
  })

  it('throws a normalized error for rejected responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({error: 'Rejected'}),
      })
    )

    await expect(
      submitJoinRequest({
        companyName: 'ACME',
        website: '',
        activityField: 'PPE',
        contactPerson: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+380670000000',
        message: '',
        edrpou: '',
        noticeLanguage: 'uk',
        termsConsent: true,
      })
    ).rejects.toThrow('Rejected')
  })
})
