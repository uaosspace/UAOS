import {describe, expect, it, vi} from 'vitest'
import {verifyTurnstileToken} from './turnstile.js'

describe('verifyTurnstileToken', () => {
  it('skips when secret is unset outside production', async () => {
    const result = await verifyTurnstileToken({
      token: '',
      env: {NODE_ENV: 'development'},
    })
    expect(result).toEqual({ok: true, skipped: true})
  })

  it('fails when secret is unset in production', async () => {
    const result = await verifyTurnstileToken({
      token: 'x',
      env: {VERCEL_ENV: 'production'},
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not configured/i)
  })

  it('soft-skips empty token when secret is configured', async () => {
    const fetchImpl = vi.fn()
    const result = await verifyTurnstileToken({
      token: '  ',
      env: {TURNSTILE_SECRET_KEY: 'secret', VERCEL_ENV: 'production'},
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result).toEqual({ok: true, skipped: true})
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('verifies non-empty token with siteverify', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      expect(body).toContain('response=tok')
      expect(body).toContain('remoteip=1.2.3.4')
      return {json: async () => ({success: true})}
    })
    const result = await verifyTurnstileToken({
      token: 'tok',
      remoteIp: '1.2.3.4',
      env: {TURNSTILE_SECRET_KEY: 'secret'},
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result).toEqual({ok: true, skipped: false})
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('rejects failed siteverify for provided token', async () => {
    const fetchImpl = vi.fn(async () => ({
      json: async () => ({success: false}),
    }))
    const result = await verifyTurnstileToken({
      token: 'bad',
      env: {TURNSTILE_SECRET_KEY: 'secret'},
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/failed/i)
  })
})
