/**
 * Vercel Serverless Function: POST /api/join
 * Validates membership application, stores it in Neon Postgres, records consent,
 * and optionally sends a low-PII Brevo notification.
 */
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {createApplication} from './_lib/applicationsRepo'
import {writeAuditEvent} from './_lib/audit'
import {notifyJoinApplicationByEmail} from './_lib/brevoNotify'
import {isDatabaseConfigured} from './_lib/db'
import {getClientIp, parseJsonBody, requireJsonContentType, requireMethod, sendJsonError} from './_lib/http'
import {
  normalizeJoinApplication,
  normalizeJoinWebsite,
  validateJoinApplication,
} from './_lib/joinApplication'
import {isRateLimited} from './_lib/rateLimitStore'
import {verifyTurnstileToken} from './_lib/turnstile'
import {isRecord, readStringOr} from '../src/lib/contentGuards'

const PRIVACY_POLICY_VERSION = process.env.PRIVACY_POLICY_VERSION?.trim() || '2026-08-03'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = crypto.randomUUID()
  res.setHeader('x-correlation-id', correlationId)

  const methodCheck = requireMethod(req, res, 'POST')
  if (methodCheck.ok === false) return methodCheck.response

  const contentTypeCheck = requireJsonContentType(req, res)
  if (contentTypeCheck.ok === false) return contentTypeCheck.response

  let body: unknown = null
  try {
    body = parseJsonBody(req)
  } catch {
    return sendJsonError(res, 400, 'Invalid JSON')
  }

  const payload = normalizeJoinApplication(body)
  const validationError = validateJoinApplication(payload)
  if (validationError) {
    return sendJsonError(res, 400, validationError)
  }

  const clientIp = getClientIp(req) || 'unknown'
  if (await isRateLimited(`join:ip:${clientIp}`)) {
    res.setHeader('Retry-After', '600')
    return sendJsonError(res, 429, 'Too many requests')
  }

  const source = isRecord(body) ? body : {}
  const turnstileToken = readStringOr(source.turnstileToken, '')
  const turnstile = await verifyTurnstileToken({token: turnstileToken, remoteIp: clientIp})
  if (!turnstile.ok) {
    return sendJsonError(res, 400, turnstile.error || 'Bot check failed')
  }

  if (!isDatabaseConfigured()) {
    return sendJsonError(res, 503, 'Join API not configured. Set DATABASE_URL.')
  }

  const website = payload.website ? normalizeJoinWebsite(payload.website) : ''
  const consentIp = clientIp === 'unknown' ? '' : clientIp
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : ''

  try {
    const {application, duplicate} = await createApplication({
      payload,
      website,
      consentIp,
      policyVersion: PRIVACY_POLICY_VERSION,
      noticeLanguage: 'uk',
      userAgent,
    })

    await writeAuditEvent({
      actorType: 'public',
      action: duplicate ? 'application.duplicate' : 'application.created',
      entityType: 'application',
      entityId: application.id,
      ip: consentIp,
      metadata: {correlationId, applicantKind: application.applicantKind},
    })

    if (!duplicate) {
      await notifyJoinApplicationByEmail({
        applicationId: application.id,
        companyName: application.companyName,
        applicantKind: application.applicantKind,
        sectors: application.sectors,
        submittedAt: application.submittedAt,
      })
    }

    return res.status(200).json({ok: true, duplicate, applicationId: application.id})
  } catch (err) {
    console.error('Join create failed:', correlationId, err)
    return sendJsonError(res, 500, 'Failed to save application')
  }
}
