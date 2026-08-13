/**
 * Cloudflare Turnstile server-side verification.
 * If TURNSTILE_SECRET_KEY is unset, verification is skipped (local/dev only).
 *
 * Temporary: empty token is allowed (widget may fail to mount on SPA).
 * When a token is present it is always verified. Restore hard-require later.
 */

export interface TurnstileVerifyResult {
  ok: boolean
  skipped: boolean
  error?: string
}

export async function verifyTurnstileToken(input: {
  token: string
  remoteIp?: string | null
  env?: NodeJS.ProcessEnv
  fetchImpl?: typeof fetch
}): Promise<TurnstileVerifyResult> {
  const env = input.env ?? process.env
  const secret = typeof env.TURNSTILE_SECRET_KEY === 'string' ? env.TURNSTILE_SECRET_KEY.trim() : ''
  const isProduction =
    env.VERCEL_ENV === 'production' ||
    env.NODE_ENV === 'production' ||
    env.UAOS_REQUIRE_TURNSTILE === '1'
  if (!secret) {
    if (isProduction) {
      return {ok: false, skipped: false, error: 'Turnstile is not configured'}
    }
    return {ok: true, skipped: true}
  }

  const token = input.token.trim()
  if (!token) {
    // Soft-skip: captcha widget missing/unready must not block join (temporary).
    return {ok: true, skipped: true}
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token)
  if (input.remoteIp) body.set('remoteip', input.remoteIp)

  try {
    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body,
    })
    const json = (await response.json()) as {success?: boolean}
    if (!json.success) {
      return {ok: false, skipped: false, error: 'Turnstile verification failed'}
    }
    return {ok: true, skipped: false}
  } catch {
    return {ok: false, skipped: false, error: 'Turnstile verification error'}
  }
}
