/**
 * Vercel Serverless Function: POST /api/join
 * Validates membership application, stores it in Neon Postgres, records consent,
 * and optionally sends a low-PII Brevo notification.
 */
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {createApplication} from './_lib/applicationsRepo.js'
import {writeAuditEvent} from './_lib/audit.js'
import {notifyJoinApplicationByEmail} from './_lib/brevoNotify.js'
import {isDatabaseConfigured} from './_lib/db.js'
import {getClientIp, parseJsonBody, requireJsonContentType, requireMethod, sendJsonError} from './_lib/http.js'
import {
  normalizeJoinApplication,
  normalizeJoinWebsite,
  validateJoinApplication,
} from './_lib/joinApplication.js'
import {isRateLimited} from './_lib/rateLimitStore.js'
import {verifyTurnstileToken} from './_lib/turnstile.js'
import {isRecord, readStringOr} from '../src/lib/contentGuards.js'
import {PRIVACY_POLICY_VERSION as PUBLISHED_POLICY_VERSION} from '../src/lib/privacyPolicy.js'
import {SITE_TERMS_VERSION} from '../src/lib/siteTerms.js'

const policyVersionOverride = process.env.PRIVACY_POLICY_VERSION?.trim() || ''
const PRIVACY_POLICY_VERSION = policyVersionOverride || PUBLISHED_POLICY_VERSION

// Розходження override і опублікованої версії означає, що в consents потрапить не той текст,
// який бачив користувач, тому воно має бути помітним у логах, а не тихим.
if (policyVersionOverride && policyVersionOverride !== PUBLISHED_POLICY_VERSION) {
  console.warn(
    `[join] PRIVACY_POLICY_VERSION override "${policyVersionOverride}" differs from published policy "${PUBLISHED_POLICY_VERSION}"`
  )
}

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
      termsVersion: SITE_TERMS_VERSION,
      noticeLanguage: payload.noticeLanguage,
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
