import type {VercelRequest, VercelResponse} from '@vercel/node'
import {parseJsonBody, sendJsonError} from '../../_lib/http.js'
import {MeetingProviderRegistry} from '../../_lib/meetings/registry.js'
import {ingestWebhook} from '../../_lib/meetings/meetingService.js'
import {UnknownMeetingProviderError} from '../../_lib/meetings/types.js'

function providerFromReq(req: VercelRequest): string {
  const fromQuery = req.query.provider
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim().toLowerCase()
  if (Array.isArray(fromQuery) && fromQuery[0]) return String(fromQuery[0]).trim().toLowerCase()
  const url = new URL(req.url || '/', 'http://localhost')
  const parts = url.pathname.replace(/^\/api\/webhooks\/meetings\/?/, '').split('/').filter(Boolean)
  return (parts[0] || '').trim().toLowerCase()
}

function rawBody(req: VercelRequest): string {
  if (typeof req.body === 'string') return req.body
  if (req.body == null) return ''
  return JSON.stringify(req.body)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendJsonError(res, 405, 'Method not allowed')
    }

    const provider = providerFromReq(req)
    if (!provider || !MeetingProviderRegistry.has(provider)) {
      return sendJsonError(res, 404, 'Unknown meeting provider')
    }

    const parsedBody = parseJsonBody(req)
    const result = await ingestWebhook({
      provider,
      headers: req.headers as Record<string, string | string[] | undefined>,
      rawBody: rawBody(req),
      parsedBody,
    })

    if (result.kind === 'crc') {
      return res.status(200).json({
        plainToken: result.plainToken,
        encryptedToken: result.encryptedToken,
      })
    }

    return res.status(200).json({ok: true, accepted: true, inserted: result.inserted})
  } catch (err) {
    if (err instanceof UnknownMeetingProviderError) {
      return sendJsonError(res, 404, err.message)
    }
    const status = typeof (err as {status?: unknown})?.status === 'number'
      ? Number((err as {status: number}).status)
      : 500
    const message = err instanceof Error ? err.message : 'Webhook failed'
    if (status >= 400 && status < 500) return sendJsonError(res, status, message)
    console.error('meetings webhook error:', message)
    return sendJsonError(res, 500, 'Webhook failed')
  }
}
