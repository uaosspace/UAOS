import type {VercelRequest, VercelResponse} from '@vercel/node'
import {
  getApplicationById,
  getApplicationStats,
  listApplications,
  updateApplicationStatus,
  type ApplicationStatus,
} from '../_lib/applicationsRepo'
import {writeAuditEvent} from '../_lib/audit'
import {getClientIp, parseJsonBody, sendJsonError} from '../_lib/http'
import {isRateLimited} from '../_lib/rateLimitStore'
import {roleHasPermission, type AdminPermission} from '../_lib/auth/policy'
import {
  assertSameOrigin,
  authenticatePassword,
  beginMfaSetup,
  clearSessionCookie,
  confirmMfaSetup,
  createSession,
  readSessionToken,
  resolveSession,
  revokeAllUserSessions,
  revokeSessionByToken,
  setSessionCookie,
  verifyUserMfa,
  type AdminSessionContext,
} from '../_lib/auth/session'
import {isRecord, readStringOr} from '../../src/lib/contentGuards'
import {
  createMediaAsset,
  deleteContentDocument,
  deleteContentEvent,
  deleteContentMember,
  deleteContentNews,
  getMediaAssetById,
  getSiteSettingsAdmin,
  listContentDocumentsAdmin,
  listContentEventsAdmin,
  listContentMembersAdmin,
  listContentNewsAdmin,
  putSiteSettings,
  upsertContentDocument,
  upsertContentEvent,
  upsertContentMember,
  upsertContentNews,
} from '../_lib/contentRepo'
import {getBlobByPathname, putPublicBlob, putPrivateBlob} from '../_lib/blobStore'

type RouteResult = {handled: true} | {handled: false}

function pathParts(req: VercelRequest): string[] {
  const route = req.query.route
  if (Array.isArray(route)) return route.map(String)
  if (typeof route === 'string' && route.length > 0) return route.split('/').filter(Boolean)
  const url = new URL(req.url || '/', 'http://localhost')
  return url.pathname.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean)
}

function isSecureRequest(req: VercelRequest): boolean {
  const proto = req.headers['x-forwarded-proto']
  return proto === 'https' || process.env.NODE_ENV === 'production'
}

async function requireSession(
  req: VercelRequest,
  res: VercelResponse,
  permission?: AdminPermission,
): Promise<AdminSessionContext | null> {
  const token = readSessionToken(req)
  if (!token) {
    sendJsonError(res, 401, 'Unauthorized')
    return null
  }
  const session = await resolveSession(token)
  if (!session) {
    sendJsonError(res, 401, 'Unauthorized')
    return null
  }
  if (permission && !roleHasPermission(session.user.role, permission)) {
    sendJsonError(res, 403, 'Forbidden')
    return null
  }
  if (
    permission &&
    (permission.startsWith('applications.') || permission === 'audit.read') &&
    !session.user.mfaEnabled &&
    session.user.role !== 'editor'
  ) {
    sendJsonError(res, 403, 'MFA required')
    return null
  }
  return session
}

function requireMutationOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return true
  if (!assertSameOrigin(req)) {
    sendJsonError(res, 403, 'Invalid origin')
    return false
  }
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = pathParts(req)
  const method = req.method || 'GET'
  const ip = getClientIp(req) || 'unknown'
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : ''

  if (method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  // Auth routes
  if (parts[0] === 'auth') {
    if (parts[1] === 'login' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      if (await isRateLimited(`admin-login:ip:${ip}`, 15 * 60 * 1000, 20)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      const body = parseJsonBody(req)
      const source = isRecord(body) ? body : {}
      const email = readStringOr(source.email, '')
      const password = readStringOr(source.password, '')
      const mfaCode = readStringOr(source.mfaCode, '')
      if (!email || !password) return sendJsonError(res, 400, 'Invalid credentials')

      const auth = await authenticatePassword(email, password)
      // Uniform message — do not reveal whether email exists
      if (!auth) return sendJsonError(res, 401, 'Invalid credentials')

      if (auth.user.mfaEnabled) {
        const ok = await verifyUserMfa(auth.user.id, mfaCode)
        if (!ok) return sendJsonError(res, 401, 'Invalid credentials')
      }

      const token = await createSession({userId: auth.user.id, ip, userAgent})
      setSessionCookie(res, token, isSecureRequest(req))
      await writeAuditEvent({
        actorType: 'admin',
        actorId: auth.user.id,
        action: 'admin.login',
        ip,
      })
      return res.status(200).json({
        ok: true,
        user: auth.user,
        mfaSetupRequired: !auth.user.mfaEnabled && auth.user.role !== 'editor',
      })
    }

    if (parts[1] === 'logout' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const token = readSessionToken(req)
      if (token) await revokeSessionByToken(token)
      clearSessionCookie(res, isSecureRequest(req))
      return res.status(200).json({ok: true})
    }

    if (parts[1] === 'me' && method === 'GET') {
      const session = await requireSession(req, res)
      if (!session) return
      return res.status(200).json({
        user: session.user,
        mfaSetupRequired: !session.user.mfaEnabled && session.user.role !== 'editor',
      })
    }

    if (parts[1] === 'mfa' && parts[2] === 'setup' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res)
      if (!session) return
      const setup = await beginMfaSetup(session.user.id, session.user.email)
      return res.status(200).json({ok: true, otpauthUrl: setup.otpauthUrl, secret: setup.secret})
    }

    if (parts[1] === 'mfa' && parts[2] === 'confirm' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res)
      if (!session) return
      const body = parseJsonBody(req)
      const code = isRecord(body) ? readStringOr(body.code, '') : ''
      const ok = await confirmMfaSetup(session.user.id, code)
      if (!ok) return sendJsonError(res, 400, 'Invalid MFA code')
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'admin.mfa_enabled',
        ip,
      })
      return res.status(200).json({ok: true})
    }

    return sendJsonError(res, 404, 'Not found')
  }

  // Applications
  if (parts[0] === 'applications') {
    if (parts.length === 1 && method === 'GET') {
      const session = await requireSession(req, res, 'applications.read')
      if (!session) return
      const url = new URL(req.url || '/', 'http://localhost')
      const status = (url.searchParams.get('status') || 'all') as ApplicationStatus | 'all'
      const items = await listApplications({
        status,
        applicantKind: url.searchParams.get('applicantKind') || undefined,
        sector: url.searchParams.get('sector') || undefined,
      })
      return res.status(200).json({items})
    }

    if (parts.length === 1 && parts[0] && method === 'GET' && false) {
      // placeholder
    }

    if (parts[1] === 'stats' && method === 'GET') {
      const session = await requireSession(req, res, 'stats.read')
      if (!session) return
      const url = new URL(req.url || '/', 'http://localhost')
      const period = url.searchParams.get('period') || 'month'
      let fromIso: string | null = null
      if (period === 'month') {
        const now = new Date()
        fromIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
      } else if (period === 'days30') {
        fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      const stats = await getApplicationStats(fromIso)
      return res.status(200).json(stats)
    }

    if (parts[1] === 'export' && method === 'GET') {
      const session = await requireSession(req, res, 'applications.export')
      if (!session) return
      const items = await listApplications({status: 'all', limit: 500})
      const header = [
        'id',
        'status',
        'companyName',
        'email',
        'phone',
        'applicantKind',
        'sectors',
        'submittedAt',
      ]
      const lines = [header.join(',')]
      for (const item of items) {
        lines.push(
          [
            item.id,
            item.status,
            csv(item.companyName),
            csv(item.email),
            csv(item.phone),
            item.applicantKind,
            csv(item.sectors.join('|')),
            item.submittedAt,
          ].join(','),
        )
      }
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'applications.export',
        ip,
        metadata: {count: items.length},
      })
      res.setHeader('content-type', 'text/csv; charset=utf-8')
      res.setHeader('content-disposition', 'attachment; filename="applications.csv"')
      return res.status(200).send(lines.join('\n'))
    }

    if (parts[1] && parts.length === 2 && method === 'GET') {
      const session = await requireSession(req, res, 'applications.read')
      if (!session) return
      const item = await getApplicationById(parts[1])
      if (!item) return sendJsonError(res, 404, 'Not found')
      return res.status(200).json({item})
    }

    if (parts[1] && parts[2] === 'status' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res, 'applications.write')
      if (!session) return
      const body = parseJsonBody(req)
      const status = isRecord(body) ? readStringOr(body.status, '') : ''
      if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
        return sendJsonError(res, 400, 'Invalid status')
      }
      const item = await updateApplicationStatus(parts[1], status as ApplicationStatus)
      if (!item) return sendJsonError(res, 404, 'Not found')
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'application.status_changed',
        entityType: 'application',
        entityId: item.id,
        ip,
        metadata: {status},
      })
      return res.status(200).json({item})
    }

    return sendJsonError(res, 404, 'Not found')
  }

  // Content CRUD
  if (parts[0] === 'content') {
    const entity = parts[1]
    if (entity === 'members') {
      if (method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({items: await listContentMembersAdmin()})
      }
      if (method === 'POST') {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const body = parseJsonBody(req)
        const item = await upsertContentMember(body)
        await writeAuditEvent({
          actorType: 'admin',
          actorId: session.user.id,
          action: 'content.member.upsert',
          entityType: 'member',
          entityId: item.id,
          ip,
        })
        return res.status(200).json({item})
      }
      if (method === 'DELETE' && parts[2]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        await deleteContentMember(parts[2])
        return res.status(200).json({ok: true})
      }
    }
    if (entity === 'news') {
      if (method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({items: await listContentNewsAdmin()})
      }
      if (method === 'POST') {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const item = await upsertContentNews(parseJsonBody(req))
        return res.status(200).json({item})
      }
      if (method === 'DELETE' && parts[2]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        await deleteContentNews(parts[2])
        return res.status(200).json({ok: true})
      }
    }
    if (entity === 'events') {
      if (method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({items: await listContentEventsAdmin()})
      }
      if (method === 'POST') {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const item = await upsertContentEvent(parseJsonBody(req))
        return res.status(200).json({item})
      }
      if (method === 'DELETE' && parts[2]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        await deleteContentEvent(parts[2])
        return res.status(200).json({ok: true})
      }
    }
    if (entity === 'documents') {
      if (method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({items: await listContentDocumentsAdmin()})
      }
      if (method === 'POST') {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const item = await upsertContentDocument(parseJsonBody(req))
        return res.status(200).json({item})
      }
      if (method === 'DELETE' && parts[2]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        await deleteContentDocument(parts[2])
        return res.status(200).json({ok: true})
      }
    }
    if (entity === 'settings') {
      if (method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({item: await getSiteSettingsAdmin()})
      }
      if (method === 'POST') {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const item = await putSiteSettings(parseJsonBody(req))
        return res.status(200).json({item})
      }
    }
    return sendJsonError(res, 404, 'Not found')
  }

  if (parts[0] === 'files' && parts[1] && method === 'GET') {
    const session = await requireSession(req, res, 'media.private')
    if (!session) return
    const asset = await getMediaAssetById(parts[1])
    if (!asset) return sendJsonError(res, 404, 'Not found')
    if (asset.visibility !== 'private') {
      return res.status(200).json({url: asset.url, redirect: true})
    }
    const blob = await getBlobByPathname(asset.storageKey, 'private')
    if (!blob) return sendJsonError(res, 404, 'Blob missing')
    await writeAuditEvent({
      actorType: 'admin',
      actorId: session.user.id,
      action: 'media.download',
      entityType: 'media',
      entityId: asset.id,
      ip,
    })
    res.setHeader('Content-Type', asset.mimeType)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asset.originalName.replace(/"/g, '')}"`,
    )
    const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer())
    return res.status(200).send(buffer)
  }

  if (parts[0] === 'media' && parts[1] === 'upload' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'media.upload')
    if (!session) return
    // Expect JSON with base64 for MVP simplicity in serverless without multipart parser
    const body = parseJsonBody(req)
    const source = isRecord(body) ? body : {}
    const fileName = readStringOr(source.fileName, 'upload.bin')
    const mimeType = readStringOr(source.mimeType, 'application/octet-stream')
    const visibility = readStringOr(source.visibility, 'public') === 'private' ? 'private' : 'public'
    const base64 = readStringOr(source.dataBase64, '')
    if (!base64) return sendJsonError(res, 400, 'Missing file data')
    if (visibility === 'private' && !roleHasPermission(session.user.role, 'media.private')) {
      return sendJsonError(res, 403, 'Forbidden')
    }
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.byteLength > 8 * 1024 * 1024) return sendJsonError(res, 400, 'File too large')
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowed.includes(mimeType)) return sendJsonError(res, 400, 'Unsupported media type')

    const uploaded =
      visibility === 'private'
        ? await putPrivateBlob(fileName, buffer, mimeType)
        : await putPublicBlob(fileName, buffer, mimeType)
    const asset = await createMediaAsset({
      storageKey: uploaded.pathname,
      url: uploaded.url,
      visibility,
      mimeType,
      byteSize: buffer.byteLength,
      originalName: fileName,
      createdBy: session.user.id,
    })
    await writeAuditEvent({
      actorType: 'admin',
      actorId: session.user.id,
      action: 'media.upload',
      entityType: 'media',
      entityId: asset.id,
      ip,
      metadata: {visibility, mimeType},
    })
    return res.status(200).json({asset})
  }

  if (parts[0] === 'session' && parts[1] === 'revoke-all' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res)
    if (!session) return
    await revokeAllUserSessions(session.user.id)
    clearSessionCookie(res, isSecureRequest(req))
    return res.status(200).json({ok: true})
  }

  return sendJsonError(res, 404, 'Not found')
}

function csv(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

// silence unused in some builds
void (null as unknown as RouteResult)
