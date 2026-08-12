import type {VercelRequest, VercelResponse} from '@vercel/node'
import {isDatabaseConfigured} from './_lib/db.js'
import {sendJsonError} from './_lib/http.js'
import {
  getPublishedSiteSettings,
  listPublishedDocuments,
  listPublishedEvents,
  listPublishedMembers,
  listPublishedNews,
} from './_lib/contentRepo.js'
import {resolveSiteAccess} from './_lib/meetings/siteAccess.js'
import {
  getEventForSiteBySlug,
  getJoinForEventBySlug,
} from './_lib/meetings/meetingService.js'

function pathParts(req: VercelRequest): string[] {
  const route = req.query.route
  if (Array.isArray(route)) return route.map(String)
  if (typeof route === 'string' && route.length > 0) return route.split('/').filter(Boolean)
  const url = new URL(req.url || '/', 'http://localhost')
  return url.pathname.replace(/^\/api\/public\/?/, '').split('/').filter(Boolean)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJsonError(res, 405, 'Method not allowed')
  }

  if (!isDatabaseConfigured()) {
    return sendJsonError(res, 503, 'Content API not configured')
  }

  const parts = pathParts(req)

  try {
    if (parts[0] === 'events' && parts.length === 2) {
      res.setHeader('Cache-Control', 'private, no-store')
      const access = await resolveSiteAccess(req)
      try {
        const payload = await getEventForSiteBySlug(parts[1], access.level)
        return res.status(200).json({item: payload.event, meeting: payload.meeting, access: {
          level: access.level,
          source: access.source,
        }})
      } catch (err) {
        const status = typeof (err as {status?: unknown})?.status === 'number'
          ? Number((err as {status: number}).status)
          : 500
        const message = err instanceof Error ? err.message : 'Event unavailable'
        return sendJsonError(res, status >= 400 && status < 600 ? status : 500, message)
      }
    }

    if (parts[0] === 'events' && parts[1] && parts[2] === 'meeting' && parts.length === 3) {
      res.setHeader('Cache-Control', 'private, no-store')
      const access = await resolveSiteAccess(req)
      if (!access.level) return sendJsonError(res, 401, 'Unauthorized')
      try {
        const meeting = await getJoinForEventBySlug(parts[1], access.level)
        return res.status(200).json({ok: true, meeting})
      } catch (err) {
        const status = typeof (err as {status?: unknown})?.status === 'number'
          ? Number((err as {status: number}).status)
          : 500
        const message = err instanceof Error ? err.message : 'Meeting unavailable'
        return sendJsonError(res, status >= 400 && status < 600 ? status : 500, message)
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    if (parts[0] === 'members' && parts.length === 1) {
      return res.status(200).json({items: await listPublishedMembers()})
    }
    if (parts[0] === 'news' && parts.length === 1) {
      return res.status(200).json({items: await listPublishedNews()})
    }
    if (parts[0] === 'events' && parts.length === 1) {
      // Personalized by admin/member cookie — must not be CDN-cached as public.
      res.setHeader('Cache-Control', 'private, no-store')
      const access = await resolveSiteAccess(req)
      return res.status(200).json({
        items: await listPublishedEvents(access.level),
        access: {level: access.level, source: access.source},
      })
    }
    if (parts[0] === 'documents' && parts.length === 1) {
      return res.status(200).json({items: await listPublishedDocuments()})
    }
    if (parts[0] === 'site-settings' && parts.length === 1) {
      return res.status(200).json({item: await getPublishedSiteSettings()})
    }
    return sendJsonError(res, 404, 'Not found')
  } catch (error) {
    console.error('Public content API error:', error)
    return sendJsonError(res, 500, 'Content unavailable')
  }
}
