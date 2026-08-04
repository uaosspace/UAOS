import {describe, expect, it, vi} from 'vitest'
import {
  buildJoinNotifyEmail,
  isBrevoNotifyConfigured,
  notifyJoinApplicationByEmail,
  parseNotifyFrom,
  readBrevoNotifyEnv,
} from './brevoNotify'

const samplePayload = {
  applicationId: '11111111-1111-1111-1111-111111111111',
  companyName: 'ACME LLC',
  applicantKind: 'producer-supplier',
  sectors: ['retail', 'construction'],
  submittedAt: '2026-08-03T10:00:00.000Z',
}

describe('brevoNotify helpers', () => {
  it('requires api key, to and from', () => {
    expect(isBrevoNotifyConfigured({})).toBe(false)
    expect(
      readBrevoNotifyEnv({
        BREVO_API_KEY: 'key',
        NOTIFY_EMAIL_TO: 'office@example.com',
        NOTIFY_EMAIL_FROM: 'UAOS <office@example.com>',
      }),
    ).toEqual({
      apiKey: 'key',
      to: 'office@example.com',
      fromRaw: 'UAOS <office@example.com>',
    })
  })

  it('parses Name <email> and bare email', () => {
    expect(parseNotifyFrom('UAOS <office@example.com>')).toEqual({
      name: 'UAOS',
      email: 'office@example.com',
    })
    expect(parseNotifyFrom('office@example.com')).toEqual({
      name: 'office@example.com',
      email: 'office@example.com',
    })
    expect(parseNotifyFrom('broken')).toBeNull()
  })

  it('builds low-PII notify email', () => {
    const email = buildJoinNotifyEmail(samplePayload)
    expect(email.subject).toContain('ACME LLC')
    expect(email.textContent).toContain('producer-supplier')
    expect(email.textContent).toContain('retail, construction')
    expect(email.textContent).toContain('pending')
    expect(email.textContent).not.toContain('@')
    expect(email.textContent).toContain('/admin')
  })

  it('skips send when env is missing', async () => {
    const fetchImpl = vi.fn()
    await expect(
      notifyJoinApplicationByEmail(samplePayload, {}, fetchImpl as unknown as typeof fetch),
    ).resolves.toBe('skipped')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts to Brevo when configured', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    })

    await expect(
      notifyJoinApplicationByEmail(
        samplePayload,
        {
          BREVO_API_KEY: 'key',
          NOTIFY_EMAIL_TO: 'office@example.com',
          NOTIFY_EMAIL_FROM: 'UAOS <office@example.com>',
        },
        fetchImpl as unknown as typeof fetch,
      ),
    ).resolves.toBe('sent')

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body)) as {
      subject: string
      tags: string[]
      to: Array<{email: string}>
      textContent: string
    }
    expect(body.to[0].email).toBe('office@example.com')
    expect(body.tags).toContain('uaos-join-application')
    expect(body.subject).toContain('ACME LLC')
    expect(body.textContent).not.toMatch(/jane@/i)
  })

  it('returns failed on non-OK Brevo response without throwing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    })

    await expect(
      notifyJoinApplicationByEmail(
        samplePayload,
        {
          BREVO_API_KEY: 'bad',
          NOTIFY_EMAIL_TO: 'office@example.com',
          NOTIFY_EMAIL_FROM: 'office@example.com',
        },
        fetchImpl as unknown as typeof fetch,
      ),
    ).resolves.toBe('failed')
  })
})
