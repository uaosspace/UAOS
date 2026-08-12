import {describe, expect, it, vi} from 'vitest'
import {
  buildAdminRecoveryEmail,
  buildCabinetCredentialsEmail,
  buildJoinNotifyEmail,
  isBrevoNotifyConfigured,
  isBrevoSenderConfigured,
  notifyJoinApplicationByEmail,
  parseNotifyFrom,
  readBrevoNotifyEnv,
  sendAdminRecoveryEmail,
} from './brevoNotify.js'

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

  it('treats sender-only env as enough for admin recovery mail', () => {
    expect(isBrevoSenderConfigured({})).toBe(false)
    expect(
      isBrevoSenderConfigured({
        BREVO_API_KEY: 'key',
        NOTIFY_EMAIL_FROM: 'UAOS <office@example.com>',
      }),
    ).toBe(true)
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

  it('builds low-PII notify email with Ukrainian labels', () => {
    const email = buildJoinNotifyEmail(samplePayload)
    expect(email.subject).toContain('ACME LLC')
    expect(email.textContent).toContain('Виробники та постачальники')
    expect(email.textContent).toContain('Роздрібна торгівля, Будівництво')
    expect(email.textContent).toContain('Очікує розгляду')
    expect(email.textContent).not.toContain('producer-supplier')
    expect(email.textContent).not.toContain('@')
    expect(email.textContent).toContain('/admin')
  })

  it('builds recovery email with temp password and MFA code', () => {
    const email = buildAdminRecoveryEmail({
      tempPassword: 'TempPass123456',
      mfaCode: '654321',
      mfaEnabled: true,
      expiresMinutes: 30,
    })
    expect(email.subject).toContain('відновлення')
    expect(email.textContent).toContain('TempPass123456')
    expect(email.textContent).toContain('654321')
    expect(email.htmlContent).toContain('TempPass123456')
  })

  it('builds cabinet credentials email with login link and temp password', () => {
    const email = buildCabinetCredentialsEmail({
      displayName: 'Jane Doe',
      email: 'member@example.com',
      temporaryPassword: 'TempPass123456789',
      cabinetUrl: 'https://uaos.example/cabinet',
    })
    expect(email.subject).toContain('кабінету')
    expect(email.textContent).toContain('member@example.com')
    expect(email.textContent).toContain('TempPass123456789')
    expect(email.textContent).toContain('https://uaos.example/cabinet')
    expect(email.textContent).toContain('змініть пароль')
  })

  it('falls back to raw ids when label is unknown', () => {
    const email = buildJoinNotifyEmail({
      ...samplePayload,
      applicantKind: 'mystery-kind',
      sectors: ['mystery-sector'],
    })
    expect(email.textContent).toContain('mystery-kind')
    expect(email.textContent).toContain('mystery-sector')
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

  it('sends recovery email to the admin account address', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    })

    await expect(
      sendAdminRecoveryEmail(
        'Admin@Example.com',
        {
          tempPassword: 'TempPass123456',
          mfaCode: '111222',
          mfaEnabled: true,
          expiresMinutes: 30,
        },
        {
          BREVO_API_KEY: 'key',
          NOTIFY_EMAIL_FROM: 'UAOS <office@example.com>',
        },
        fetchImpl as unknown as typeof fetch,
      ),
    ).resolves.toBe('sent')

    const body = JSON.parse(String((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body)) as {
      to: Array<{email: string}>
      tags: string[]
    }
    expect(body.to[0].email).toBe('admin@example.com')
    expect(body.tags).toContain('uaos-admin-recovery')
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
