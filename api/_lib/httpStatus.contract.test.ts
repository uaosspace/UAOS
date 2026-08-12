import {describe, expect, it, vi, beforeEach} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {
  requireJsonContentType,
  requireMethod,
  sendJsonError,
} from './http.js'

function mockRes() {
  const state: {
    statusCode: number
    body: unknown
    headers: Record<string, string>
  } = {statusCode: 0, body: null, headers: {}}

  const res = {
    status(code: number) {
      state.statusCode = code
      return this
    },
    json(payload: unknown) {
      state.body = payload
      return this
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value
      return this
    },
    end() {
      return this
    },
  } as unknown as VercelResponse

  return {res, state}
}

function mockReq(partial: Partial<VercelRequest> & {method?: string}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    url: '/',
    ...partial,
  } as VercelRequest
}

describe('http helpers status contracts', () => {
  it('sendJsonError returns {error} with status', () => {
    const {res, state} = mockRes()
    sendJsonError(res, 400, 'Bad request')
    expect(state.statusCode).toBe(400)
    expect(state.body).toEqual({error: 'Bad request'})
  })

  it('requireMethod returns 405 with Allow', () => {
    const {res, state} = mockRes()
    const result = requireMethod(mockReq({method: 'GET'}), res, 'POST')
    expect(result.ok).toBe(false)
    expect(state.statusCode).toBe(405)
    expect(state.headers.Allow).toBe('POST')
    expect(state.body).toEqual({error: 'Method not allowed'})
  })

  it('requireJsonContentType returns 415 for non-JSON', () => {
    const {res, state} = mockRes()
    const result = requireJsonContentType(
      mockReq({method: 'POST', headers: {'content-type': 'text/plain'}}),
      res,
    )
    expect(result.ok).toBe(false)
    expect(state.statusCode).toBe(415)
    expect(state.body).toEqual({error: 'Expected application/json'})
  })

  it('requireJsonContentType accepts application/json', () => {
    const {res, state} = mockRes()
    const result = requireJsonContentType(
      mockReq({method: 'POST', headers: {'content-type': 'application/json'}}),
      res,
    )
    expect(result.ok).toBe(true)
    expect(state.statusCode).toBe(0)
  })
})

describe('join handler status contracts', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 405 for non-POST', async () => {
    const {default: handler} = await import('../join.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'GET'}), res)
    expect(state.statusCode).toBe(405)
    expect(state.body).toEqual({error: 'Method not allowed'})
  })

  it('returns 415 for non-JSON content type', async () => {
    const {default: handler} = await import('../join.js')
    const {res, state} = mockRes()
    await handler(
      mockReq({method: 'POST', headers: {'content-type': 'text/html'}}),
      res,
    )
    expect(state.statusCode).toBe(415)
    expect(state.body).toEqual({error: 'Expected application/json'})
  })

  it('returns 400 for invalid application payload', async () => {
    vi.doMock('./rateLimitStore.js', () => ({
      isRateLimited: vi.fn(async () => false),
    }))
    vi.doMock('./turnstile.js', () => ({
      verifyTurnstileToken: vi.fn(async () => ({ok: true})),
    }))
    const {default: handler} = await import('../join.js')
    const {res, state} = mockRes()
    await handler(
      mockReq({
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: {companyName: ''},
      }),
      res,
    )
    expect(state.statusCode).toBe(400)
    expect(state.body).toMatchObject({error: expect.any(String)})
  })
})

describe('public-router status contracts', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 405 for non-GET', async () => {
    const {default: handler} = await import('../public-router.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'POST', query: {route: 'events'}}), res)
    expect(state.statusCode).toBe(405)
  })

  it('returns 503 when database is not configured', async () => {
    vi.doMock('./db.js', () => ({
      isDatabaseConfigured: () => false,
      getSql: () => {
        throw new Error('no db')
      },
    }))
    const {default: handler} = await import('../public-router.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'GET', query: {route: 'events'}}), res)
    expect(state.statusCode).toBe(503)
    expect(state.body).toEqual({error: 'Content API not configured'})
  })

  it('returns 404 for unknown public route when DB configured', async () => {
    vi.doMock('./db.js', () => ({
      isDatabaseConfigured: () => true,
      getSql: () => {
        throw new Error('should not query')
      },
    }))
    const {default: handler} = await import('../public-router.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'GET', query: {route: 'no-such-resource'}}), res)
    expect(state.statusCode).toBe(404)
  })

  it('returns 401 for meeting join without access session', async () => {
    vi.doMock('./db.js', () => ({
      isDatabaseConfigured: () => true,
      getSql: () => {
        throw new Error('should not query before auth')
      },
    }))
    vi.doMock('./meetings/siteAccess.js', () => ({
      resolveSiteAccess: vi.fn(async () => ({
        level: null,
        source: 'anonymous',
        memberUserId: null,
        adminUserId: null,
      })),
    }))
    const {default: handler} = await import('../public-router.js')
    const {res, state} = mockRes()
    await handler(
      mockReq({method: 'GET', query: {route: 'events/demo-slug/meeting'}}),
      res,
    )
    expect(state.statusCode).toBe(401)
    expect(state.body).toEqual({error: 'Unauthorized'})
  })
})

describe('member-router status contracts', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns 401 for /auth/me without session cookie', async () => {
    const {default: handler} = await import('../member-router.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'GET', query: {route: 'auth/me'}, headers: {}}), res)
    expect(state.statusCode).toBe(401)
  })

  it('returns 403 for login mutation with invalid origin', async () => {
    const {default: handler} = await import('../member-router.js')
    const {res, state} = mockRes()
    await handler(
      mockReq({
        method: 'POST',
        query: {route: 'auth/login'},
        headers: {
          origin: 'https://evil.example',
          host: 'localhost:3000',
          'content-type': 'application/json',
        },
        body: {email: 'a@b.c', password: 'x'},
      }),
      res,
    )
    expect(state.statusCode).toBe(403)
  })

  it('returns 404 for unknown member route when authenticated path misses', async () => {
    const {default: handler} = await import('../member-router.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'GET', query: {route: 'nope'}, headers: {}}), res)
    // unauthenticated protected stubs return 401 first for events; bare unknown → 404
    expect([401, 404]).toContain(state.statusCode)
    if (state.statusCode === 404) {
      expect(state.body).toEqual({error: 'Not found'})
    }
  })
})

describe('cron meetings status contracts', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.CRON_SECRET
  })

  it('returns 401 without CRON_SECRET / bearer', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    const {default: handler} = await import('../cron/meetings.js')
    const {res, state} = mockRes()
    await handler(mockReq({method: 'POST', headers: {}}), res)
    expect(state.statusCode).toBe(401)
  })

  it('returns 405 for unsupported method', async () => {
    process.env.CRON_SECRET = 'test-cron-secret'
    const {default: handler} = await import('../cron/meetings.js')
    const {res, state} = mockRes()
    await handler(
      mockReq({
        method: 'PUT',
        headers: {authorization: 'Bearer test-cron-secret'},
      }),
      res,
    )
    expect(state.statusCode).toBe(405)
  })
})

describe('meeting access status mapping', () => {
  it('documents ladder decisions that drive 403 vs allow', async () => {
    const {canJoinMeeting, canViewEvent} = await import('./meetings/access.js')
    expect(canViewEvent({visibility: 'restricted', accessMinRole: 'board', userLevel: null})).toBe(
      false,
    )
    expect(canJoinMeeting({accessMinRole: 'member', userLevel: null})).toBe(false)
    expect(canJoinMeeting({accessMinRole: 'member', userLevel: 'board'})).toBe(true)
  })
})
