import type {VercelRequest, VercelResponse} from '@vercel/node'
import {isDatabaseConfigured} from '../lib/db'
import {sendJsonError} from '../lib/http'
import {
  getPublishedSiteSettings,
  listPublishedDocuments,
  listPublishedEvents,
  listPublishedMembers,
  listPublishedNews,
} from '../lib/contentRepo'

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
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  try {
    if (parts[0] === 'members' && parts.length === 1) {
      return res.status(200).json({items: await listPublishedMembers()})
    }
    if (parts[0] === 'news' && parts.length === 1) {
      return res.status(200).json({items: await listPublishedNews()})
    }
    if (parts[0] === 'events' && parts.length === 1) {
      return res.status(200).json({items: await listPublishedEvents()})
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
