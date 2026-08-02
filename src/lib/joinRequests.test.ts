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
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/join',
      expect.objectContaining({
        method: 'POST',
      })
    )
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
      })
    ).rejects.toThrow('Rejected')
  })
})
