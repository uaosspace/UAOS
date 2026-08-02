/**
 * Vercel Serverless Function: POST /api/join
 * Saves membership application to Sanity (requires SANITY_API_WRITE_TOKEN).
 * Optionally forwards to Formspree if FORMSPREE_JOIN_ENDPOINT is set.
 */
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {createClient} from '@sanity/client'
import {getClientIp, parseJsonBody, requireJsonContentType, requireMethod, sendJsonError} from './lib/http'
import {
  normalizeJoinApplication,
  normalizeJoinWebsite,
  readJoinDestinationEnv,
  validateJoinApplication,
} from './lib/joinApplication'
import {MemoryRateLimiter} from './lib/rateLimit'

const joinRateLimiter = new MemoryRateLimiter(10 * 60 * 1000, 5)

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const rateKey = `ip:${clientIp}`
  if (joinRateLimiter.isLimited(rateKey)) {
    return sendJsonError(res, 429, 'Too many requests')
  }

  const website = payload.website ? normalizeJoinWebsite(payload.website) : ''
  const destinations = readJoinDestinationEnv()

  let sanitySaved = false

  if (destinations.projectId && destinations.projectId !== 'yourProjectId' && destinations.token) {
    try {
      const client = createClient({
        projectId: destinations.projectId,
        dataset: destinations.dataset,
        apiVersion: '2025-01-01',
        token: destinations.token,
        useCdn: false,
      })
      await client.create({
        _type: 'joinRequest',
        status: 'pending',
        companyName: payload.companyName,
        website: website || '',
        activityField: payload.activityField,
        edrpou: payload.edrpou || '',
        contactPerson: payload.contactPerson,
        email: payload.email,
        phone: payload.phone,
        message: payload.message || '',
        privacyConsent: true,
        consentTimestamp: payload.consentTimestamp,
        consentIp: clientIp === 'unknown' ? '' : clientIp,
        submittedAt: payload.consentTimestamp,
      })
      sanitySaved = true
    } catch (err) {
      console.error('Sanity join create failed:', err)
    }
  }

  const formspree = destinations.formspree
  if (formspree) {
    try {
      await fetch(formspree, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({
          companyName: payload.companyName,
          website: website || '',
          activityField: payload.activityField,
          edrpou: payload.edrpou || '',
          contactPerson: payload.contactPerson,
          email: payload.email,
          phone: payload.phone,
          message: payload.message || '',
          privacyConsent: true,
          consentTimestamp: payload.consentTimestamp,
        }),
      })
    } catch (err) {
      console.error('Formspree forward failed:', err)
    }
  }

  if (!sanitySaved && !formspree) {
    return sendJsonError(
      res,
      503,
      'Join API not configured. Set SANITY_API_WRITE_TOKEN or FORMSPREE_JOIN_ENDPOINT.'
    )
  }

  return res.status(200).json({ok: true, sanitySaved})
}
