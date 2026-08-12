import type {VercelRequest, VercelResponse} from '@vercel/node'
import {sendJsonError} from '../_lib/http.js'
import {processMeetingCronJobs} from '../_lib/meetings/meetingService.js'

function authorizeCron(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = req.headers.authorization
  if (typeof header === 'string' && header === `Bearer ${secret}`) return true
  const query = req.query.secret
  if (typeof query === 'string' && query === secret) return true
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJsonError(res, 405, 'Method not allowed')
  }
  if (!authorizeCron(req)) {
    return sendJsonError(res, 401, 'Unauthorized')
  }
  try {
    const result = await processMeetingCronJobs()
    return res.status(200).json({ok: true, ...result})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron failed'
    console.error('meetings cron error:', message)
    return sendJsonError(res, 500, 'Cron failed')
  }
}
