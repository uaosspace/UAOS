import type {VercelRequest, VercelResponse} from '@vercel/node'
import {getClientIp, parseJsonBody, sendJsonError} from './_lib/http.js'
import {isRateLimited} from './_lib/rateLimitStore.js'
import {isRecord, readStringOr} from '../src/lib/contentGuards.js'
import {
  assertSameOrigin,
  authenticateMemberPassword,
  clearMemberSessionCookie,
  createMemberSession,
  readMemberSessionToken,
  resolveMemberSession,
  revokeMemberSessionByToken,
  setMemberSessionCookie,
  type MemberSessionContext,
} from './_lib/auth/memberSession.js'

function pathParts(req: VercelRequest): string[] {
  const route = req.query.route
  if (Array.isArray(route)) return route.map(String)
  if (typeof route === 'string' && route.length > 0) return route.split('/').filter(Boolean)
  const url = new URL(req.url || '/', 'http://localhost')
  return url.pathname.replace(/^\/api\/member\/?/, '').split('/').filter(Boolean)
}

function isSecureRequest(req: VercelRequest): boolean {
  const proto = req.headers['x-forwarded-proto']
  return proto === 'https' || process.env.NODE_ENV === 'production'
}

function requireMutationOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (!assertSameOrigin(req)) {
    sendJsonError(res, 403, 'Forbidden')
    return false
  }
  return true
}

async function requireMemberSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<MemberSessionContext | null> {
  const token = readMemberSessionToken(req)
  if (!token) {
    sendJsonError(res, 401, 'Unauthorized')
    return null
  }
  const session = await resolveMemberSession(token)
  if (!session) {
    clearMemberSessionCookie(res, isSecureRequest(req))
    sendJsonError(res, 401, 'Unauthorized')
    return null
  }
  return session
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await handleMemberRequest(req, res)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('member handler error:', message)
    if (!res.headersSent) {
      return sendJsonError(res, 500, 'Internal server error')
    }
  }
}

async function handleMemberRequest(req: VercelRequest, res: VercelResponse) {
  const parts = pathParts(req)
  const method = req.method || 'GET'
  const ip = getClientIp(req) || 'unknown'
  const userAgent =
    typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : ''

  if (method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (parts[0] === 'auth') {
    if (parts[1] === 'login' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      if (await isRateLimited(`member-login:ip:${ip}`, 15 * 60 * 1000, 20)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      const body = parseJsonBody(req)
      const source = isRecord(body) ? body : {}
      const email = readStringOr(source.email, '')
      const password = readStringOr(source.password, '')
      if (!email || !password) return sendJsonError(res, 401, 'Invalid credentials')

      const user = await authenticateMemberPassword(email, password)
      if (!user) return sendJsonError(res, 401, 'Invalid credentials')

      const token = await createMemberSession({userId: user.id, ip, userAgent})
      setMemberSessionCookie(res, token, isSecureRequest(req))
      return res.status(200).json({ok: true, user})
    }

    if (parts[1] === 'logout' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const token = readMemberSessionToken(req)
      if (token) await revokeMemberSessionByToken(token)
      clearMemberSessionCookie(res, isSecureRequest(req))
      return res.status(200).json({ok: true})
    }

    if (parts[1] === 'me' && method === 'GET') {
      const token = readMemberSessionToken(req)
      if (!token) return sendJsonError(res, 401, 'Unauthorized')
      const session = await resolveMemberSession(token)
      if (!session) {
        clearMemberSessionCookie(res, isSecureRequest(req))
        return sendJsonError(res, 401, 'Unauthorized')
      }
      return res.status(200).json({ok: true, user: session.user})
    }

    return sendJsonError(res, 404, 'Not found')
  }

  // Authenticated stub surface for future cabinet features
  if (parts[0] === 'cabinet' && parts[1] === 'summary' && method === 'GET') {
    const session = await requireMemberSession(req, res)
    if (!session) return
    return res.status(200).json({
      ok: true,
      user: session.user,
      stub: {
        profileEditable: false,
        message: 'Member cabinet foundation — profile editing comes later',
      },
    })
  }

  return sendJsonError(res, 404, 'Not found')
}
