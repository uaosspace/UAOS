import type {VercelRequest, VercelResponse} from '@vercel/node'
import {
  deleteClosedApplication,
  deleteClosedApplications,
  getApplicationById,
  getApplicationStats,
  listApplications,
  updateApplicationStatus,
  type ApplicationStatus,
} from './_lib/applicationsRepo.js'
import {writeAuditEvent} from './_lib/audit.js'
import {getClientIp, parseJsonBody, sendJsonError} from './_lib/http.js'
import {isRateLimited} from './_lib/rateLimitStore.js'
import {roleHasPermission, type AdminPermission} from './_lib/auth/policy.js'
import {
  assertSameOrigin,
  authenticatePassword,
  beginMfaSetup,
  clearSessionCookie,
  confirmMfaSetup,
  createSession,
  findAdminByEmail,
  applyAdminPasswordRecovery,
  generateRecoveryMfaCode,
  generateTempAdminPassword,
  RECOVERY_MFA_TTL_MINUTES,
  readSessionToken,
  resolveSession,
  revokeAllUserSessions,
  revokeOtherUserSessions,
  revokeSessionByToken,
  setSessionCookie,
  verifyUserMfa,
  changeAdminPassword,
  type AdminSessionContext,
} from './_lib/auth/session.js'
import {
  isBrevoSenderConfigured,
  sendAdminRecoveryEmail,
} from './_lib/brevoNotify.js'
import {isRecord, readStringOr} from '../src/lib/contentGuards.js'
import {LOCALES, type Locale} from '../src/data/locales.js'
import {
  isGeminiConfigured,
  translateFieldsWithGemini,
} from './_lib/geminiTranslate.js'
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
} from './_lib/contentRepo.js'
import {
  buildCabinetUsersCsv,
  buildContentMembersCatalogCsv,
} from './_lib/memberDirectoryExport.js'
import {listCabinetDirectoryForNotify} from './_lib/meetings/eventNotifyRecipients.js'
import {getBlobByPathname, putPublicBlob, putPrivateBlob} from './_lib/blobStore.js'
import {fetchOgImageFromPageUrl} from './_lib/fetchOgImage.js'
import {
  createMemberUser,
  deleteMemberUserAdmin,
  listMemberUsersAdmin,
  updateMemberUserAccessLevelAdmin,
} from './_lib/auth/memberSession.js'
import {
  approveReportForEvent,
  cancelExternalMeetingForEvent,
  createMeetingForEvent,
  getMeetingBundleForEvent,
  getMeetingDtoForEvent,
  getReportDtoForEvent,
  listMeetingsAdmin,
  listReportsAdmin,
  patchReportForEvent,
  processInbox,
  processMeetingCronJobs,
  processProviderEventById,
  retryMeetingForEvent,
  uploadManualTranscriptForEvent,
} from './_lib/meetings/meetingService.js'
import {getMeetingOpsSettings, putMeetingOpsSettings} from './_lib/meetings/opsSettingsRepo.js'
import {listPendingProviderEvents} from './_lib/meetings/providerEventsRepo.js'
import {ASSIGNABLE_ACCESS_LEVELS} from './_lib/meetings/accessCore.js'
import {MeetingProviderRegistry} from './_lib/meetings/registry.js'
import {ProviderNotImplementedError, UnknownMeetingProviderError} from './_lib/meetings/types.js'

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
  try {
    await handleAdminRequest(req, res)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('admin handler error:', message)
    if (!res.headersSent) {
      return sendJsonError(res, 500, 'Internal server error')
    }
  }
}

async function handleAdminRequest(req: VercelRequest, res: VercelResponse) {
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

    if (parts[1] === 'forgot-password' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      if (await isRateLimited(`admin-forgot:ip:${ip}`, 15 * 60 * 1000, 8)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      if (!isBrevoSenderConfigured()) {
        return sendJsonError(res, 503, 'Recovery email is not configured')
      }

      const body = parseJsonBody(req)
      const email = isRecord(body) ? readStringOr(body.email, '').trim().toLowerCase() : ''
      if (!email || !email.includes('@')) {
        return sendJsonError(res, 400, 'Email required')
      }
      if (await isRateLimited(`admin-forgot:email:${email}`, 15 * 60 * 1000, 3)) {
        return sendJsonError(res, 429, 'Too many requests')
      }

      const row = await findAdminByEmail(email)
      // Uniform success — do not reveal whether the account exists
      const uniformOk = () =>
        res.status(200).json({
          ok: true,
          message: 'If the account exists, recovery credentials were emailed',
        })

      if (!row || !row.active) return uniformOk()

      const userId = String(row.id)
      const mfaEnabled = Boolean(row.mfa_enabled)
      const tempPassword = generateTempAdminPassword()
      const recoveryMfaCode = mfaEnabled ? generateRecoveryMfaCode() : null

      await applyAdminPasswordRecovery({
        userId,
        tempPassword,
        recoveryMfaCode,
      })
      await revokeAllUserSessions(userId)

      const mail = await sendAdminRecoveryEmail(email, {
        tempPassword,
        mfaCode: recoveryMfaCode,
        mfaEnabled,
        expiresMinutes: RECOVERY_MFA_TTL_MINUTES,
      })

      await writeAuditEvent({
        actorType: 'admin',
        actorId: userId,
        action: 'admin.password_recovery',
        entityType: 'admin_user',
        entityId: userId,
        ip,
        metadata: {mail},
      })

      if (mail !== 'sent') {
        // Do not change the HTTP shape — enumeration-safe. Ops can reset via admin:create.
        console.error('admin recovery email was not sent:', mail)
      }

      return uniformOk()
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

    if (parts[1] === 'change-password' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res)
      if (!session) return
      if (await isRateLimited(`admin:change-password:${session.user.id}`, 15 * 60 * 1000, 10)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      const body = parseJsonBody(req)
      const source = isRecord(body) ? body : {}
      const currentPassword = readStringOr(source.currentPassword, '')
      const newPassword = readStringOr(source.newPassword, '')
      if (!currentPassword || !newPassword) {
        return sendJsonError(res, 400, 'currentPassword and newPassword required')
      }
      try {
        await changeAdminPassword({
          userId: session.user.id,
          currentPassword,
          newPassword,
        })
        await revokeOtherUserSessions(session.user.id, session.sessionId)
        await writeAuditEvent({
          actorType: 'admin',
          actorId: session.user.id,
          action: 'admin.password_changed',
          entityType: 'admin_user',
          entityId: session.user.id,
          ip,
        })
        return res.status(200).json({ok: true})
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Password change failed'
        return sendJsonError(res, 400, message)
      }
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

    if (parts[1] && parts[2] === 'provision-cabinet' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res, 'applications.write')
      if (!session) return
      if (await isRateLimited(`admin:provision-cabinet:${session.user.id}`, 15 * 60 * 1000, 30)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      const body = parseJsonBody(req)
      const source = isRecord(body) ? body : {}
      const accessLevel = readStringOr(source.accessLevel, 'member')
      const displayName = readStringOr(source.displayName, '')
      try {
        const {provisionCabinetFromApplication} = await import('./_lib/provisionCabinet.js')
        const result = await provisionCabinetFromApplication({
          applicationId: parts[1],
          accessLevel,
          displayName,
          actorId: session.user.id,
          ip,
        })
        return res.status(200).json({
          ok: true,
          user: result.user,
          emailSent: result.emailSent,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Provision failed'
        return sendJsonError(res, 400, message)
      }
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

    if (parts[1] === 'closed' && method === 'DELETE') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res, 'applications.write')
      if (!session) return
      if (await isRateLimited(`admin:apps-purge:${session.user.id}`, 15 * 60 * 1000, 10)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      const deleted = await deleteClosedApplications()
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'applications.purge_closed',
        ip,
        metadata: {deleted},
      })
      return res.status(200).json({ok: true, deleted})
    }

    if (parts[1] && parts.length === 2 && method === 'DELETE') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res, 'applications.write')
      if (!session) return
      if (await isRateLimited(`admin:apps-delete:${session.user.id}`, 15 * 60 * 1000, 30)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      try {
        const item = await deleteClosedApplication(parts[1])
        if (!item) return sendJsonError(res, 404, 'Not found')
        await writeAuditEvent({
          actorType: 'admin',
          actorId: session.user.id,
          action: 'application.deleted',
          entityType: 'application',
          entityId: item.id,
          ip,
          metadata: {status: item.status, companyName: item.companyName},
        })
        return res.status(200).json({ok: true, id: item.id})
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed'
        return sendJsonError(res, 400, message)
      }
    }

    return sendJsonError(res, 404, 'Not found')
  }

  // Content CRUD
  if (parts[0] === 'content') {
    const entity = parts[1]

    if (entity === 'translate' && method === 'POST') {
      if (!requireMutationOrigin(req, res)) return
      const session = await requireSession(req, res, 'content.write')
      if (!session) return
      if (await isRateLimited(`admin:translate:${session.user.id}`, 15 * 60 * 1000, 30)) {
        return sendJsonError(res, 429, 'Too many requests')
      }
      if (!isGeminiConfigured()) {
        return sendJsonError(res, 503, 'Translation is not configured')
      }

      const body = parseJsonBody(req)
      const source = isRecord(body) ? body : {}
      const sourceLocaleRaw = readStringOr(source.sourceLocale, '')
      const sourceLocale = (LOCALES as readonly string[]).includes(sourceLocaleRaw)
        ? (sourceLocaleRaw as Locale)
        : null
      if (!sourceLocale) return sendJsonError(res, 400, 'Invalid sourceLocale')

      const targetRaw = source.targetLocales
      const targetLocales = Array.isArray(targetRaw)
        ? targetRaw
            .filter((item): item is string => typeof item === 'string')
            .filter((item): item is Locale => (LOCALES as readonly string[]).includes(item))
        : []

      const fieldsRaw = isRecord(source.fields) ? source.fields : {}
      const fields: Record<string, string> = {}
      for (const [key, value] of Object.entries(fieldsRaw)) {
        if (typeof value === 'string' && value.trim()) fields[key] = value
      }

      try {
        const result = await translateFieldsWithGemini({
          sourceLocale,
          targetLocales:
            targetLocales.length > 0
              ? targetLocales.filter((locale) => locale !== sourceLocale)
              : LOCALES.filter((locale) => locale !== sourceLocale),
          fields,
        })
        await writeAuditEvent({
          actorType: 'admin',
          actorId: session.user.id,
          action: 'content.translate_draft',
          ip,
          metadata: {
            sourceLocale,
            targetLocales: result.translations
              ? Object.keys(Object.values(result.translations)[0] || {})
              : [],
            fieldKeys: Object.keys(fields),
            model: result.model,
          },
        })
        return res.status(200).json({ok: true, translations: result.translations, model: result.model})
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Translation failed'
        const status =
          message.includes('not configured') || message.includes('Translation service')
            ? 503
            : 400
        return sendJsonError(res, status, message)
      }
    }

    if (entity === 'members') {
      if (parts[2] === 'export' && method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        const body = await buildContentMembersCatalogCsv()
        await writeAuditEvent({
          actorType: 'admin',
          actorId: session.user.id,
          action: 'content.members.export',
          ip,
          metadata: {bytes: body.length},
        })
        res.setHeader('content-type', 'text/csv; charset=utf-8')
        res.setHeader('content-disposition', 'attachment; filename="members-catalog.csv"')
        return res.status(200).send(body)
      }
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
        try {
          const item = await upsertContentMember(body)
          await writeAuditEvent({
            actorType: 'admin',
            actorId: session.user.id,
            action: 'content.member.upsert',
            entityType: 'member',
            entityId: String((item as {id?: unknown}).id ?? ''),
            ip,
          })
          return res.status(200).json({item})
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Save failed'
          return sendJsonError(res, 400, message)
        }
      }
      if (method === 'DELETE' && parts[2]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        try {
          await deleteContentMember(parts[2])
          await writeAuditEvent({
            actorType: 'admin',
            actorId: session.user.id,
            action: 'content.member.delete',
            entityType: 'member',
            entityId: parts[2],
            ip,
          })
          return res.status(200).json({ok: true})
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Delete failed'
          return sendJsonError(res, 400, message)
        }
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
      if (parts[2] === 'notify-directory' && method === 'GET') {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({items: await listCabinetDirectoryForNotify()})
      }
      // Meetings / reports nested under content/events/:id/... (before list/create handlers)
      if (parts[2] && parts[3] === 'meeting') {
        const eventId = parts[2]
        if (method === 'GET' && !parts[4]) {
          const session = await requireSession(req, res, 'content.read')
          if (!session) return
          const meeting = await getMeetingDtoForEvent(eventId)
          return res.status(200).json({meeting})
        }
        if (method === 'POST' && !parts[4]) {
          if (!requireMutationOrigin(req, res)) return
          const session = await requireSession(req, res, 'content.write')
          if (!session) return
          try {
            const body = parseJsonBody(req)
            const provider =
              typeof body === 'object' && body && 'provider' in body
                ? String((body as {provider?: unknown}).provider || 'zoom')
                : 'zoom'
            const result = await createMeetingForEvent({eventId, provider})
            await writeAuditEvent({
              actorType: 'admin',
              actorId: session.user.id,
              action: 'meeting.create',
              entityType: 'meeting',
              entityId: result.meeting.id,
              ip,
              metadata: {eventId, provider: result.meeting.provider},
            })
            return res.status(200).json(result)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Create meeting failed'
            const status =
              err instanceof UnknownMeetingProviderError || err instanceof ProviderNotImplementedError
                ? 400
                : 502
            return sendJsonError(res, status, message)
          }
        }
        if (method === 'POST' && parts[4] === 'retry') {
          if (!requireMutationOrigin(req, res)) return
          const session = await requireSession(req, res, 'content.write')
          if (!session) return
          try {
            const result = await retryMeetingForEvent(eventId)
            await writeAuditEvent({
              actorType: 'admin',
              actorId: session.user.id,
              action: 'meeting.retry',
              entityType: 'meeting',
              entityId: result.meeting.id,
              ip,
              metadata: {eventId},
            })
            return res.status(200).json(result)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Retry failed'
            return sendJsonError(res, 502, message)
          }
        }
        if (method === 'POST' && parts[4] === 'transcript') {
          if (!requireMutationOrigin(req, res)) return
          const session = await requireSession(req, res, 'content.write')
          if (!session) return
          if (await isRateLimited(`admin:meeting-transcript:${session.user.id}`, 60_000, 10)) {
            return sendJsonError(res, 429, 'Too many requests')
          }
          try {
            const body = parseJsonBody(req)
            const source = isRecord(body) ? body : {}
            const result = await uploadManualTranscriptForEvent({
              eventId,
              fileName: readStringOr(source.fileName, ''),
              dataBase64: readStringOr(source.dataBase64, ''),
              generateDraft: source.generateDraft !== false,
            })
            await writeAuditEvent({
              actorType: 'admin',
              actorId: session.user.id,
              action: 'meeting.transcript_upload',
              entityType: 'meeting',
              entityId: result.meeting.id,
              ip,
              metadata: {
                eventId,
                draftGenerated: result.draftGenerated,
                hasDraftError: Boolean(result.draftError),
              },
            })
            return res.status(200).json(result)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Transcript upload failed'
            return sendJsonError(res, 400, message)
          }
        }
      }
      if (parts[2] && parts[3] === 'report') {
        const eventId = parts[2]
        if (method === 'GET' && !parts[4]) {
          const session = await requireSession(req, res, 'content.read')
          if (!session) return
          const report = await getReportDtoForEvent(eventId)
          return res.status(200).json({report})
        }
        if (method === 'PATCH' && !parts[4]) {
          if (!requireMutationOrigin(req, res)) return
          const session = await requireSession(req, res, 'content.write')
          if (!session) return
          try {
            const body = parseJsonBody(req)
            const source = isRecord(body) ? body : {}
            const report = await patchReportForEvent(eventId, {
              editedSummary:
                typeof source.editedSummary === 'string' ? source.editedSummary : undefined,
              editedTopics: Array.isArray(source.editedTopics) ? source.editedTopics : undefined,
              editedDecisions: Array.isArray(source.editedDecisions)
                ? source.editedDecisions
                : undefined,
              editedActionItems: Array.isArray(source.editedActionItems)
                ? source.editedActionItems
                : undefined,
              status:
                source.status === 'draft' ||
                source.status === 'in_review' ||
                source.status === 'rejected'
                  ? source.status
                  : undefined,
            })
            return res.status(200).json({report})
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Patch report failed'
            return sendJsonError(res, 400, message)
          }
        }
        if (method === 'POST' && parts[4] === 'approve') {
          if (!requireMutationOrigin(req, res)) return
          const session = await requireSession(req, res, 'content.write')
          if (!session) return
          try {
            const report = await approveReportForEvent(eventId, session.user.id)
            await writeAuditEvent({
              actorType: 'admin',
              actorId: session.user.id,
              action: 'meeting_report.approve',
              entityType: 'meeting_report',
              entityId: report.id,
              ip,
              metadata: {eventId},
            })
            return res.status(200).json({report})
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Approve failed'
            return sendJsonError(res, 400, message)
          }
        }
      }
      if (method === 'GET' && !parts[2]) {
        const session = await requireSession(req, res, 'content.read')
        if (!session) return
        return res.status(200).json({items: await listContentEventsAdmin()})
      }
      if (method === 'POST' && !parts[2]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const item = await upsertContentEvent(parseJsonBody(req))
        return res.status(200).json({item})
      }
      if (method === 'DELETE' && parts[2] && !parts[3]) {
        if (!requireMutationOrigin(req, res)) return
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        // Zoom first (no orphan meetings), then DB row + cover Blob cleanup.
        await cancelExternalMeetingForEvent(parts[2])
        await deleteContentEvent(parts[2])
        return res.status(200).json({ok: true})
      }
      if (parts[2] && parts[3] === 'bundle' && method === 'GET') {
        const session = await requireSession(req, res, 'content.write')
        if (!session) return
        const bundle = await getMeetingBundleForEvent(parts[2])
        return res.status(200).json({bundle})
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

    try {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      console.error('media.upload failed:', message)
      return sendJsonError(res, 400, message)
    }
  }

  if (parts[0] === 'media' && parts[1] === 'fetch-og' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    if (await isRateLimited(`admin:fetch-og:${session.user.id}`, 60_000, 20)) {
      return sendJsonError(res, 429, 'Too many requests')
    }
    const body = parseJsonBody(req)
    const source = isRecord(body) ? body : {}
    const pageUrl = readStringOr(source.url, '')
    if (!pageUrl) return sendJsonError(res, 400, 'url required')
    try {
      const imageUrl = await fetchOgImageFromPageUrl(pageUrl)
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'media.fetch_og',
        entityType: 'media',
        entityId: '',
        ip,
        metadata: {pageUrl},
      })
      return res.status(200).json({imageUrl})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fetch failed'
      return sendJsonError(res, 400, message)
    }
  }

  if (parts[0] === 'session' && parts[1] === 'revoke-all' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res)
    if (!session) return
    await revokeAllUserSessions(session.user.id)
    clearSessionCookie(res, isSecureRequest(req))
    return res.status(200).json({ok: true})
  }

  // Provision member portal accounts (ops / users.manage). No public self-signup.
  if (parts[0] === 'member-users' && parts[1] === 'export' && method === 'GET') {
    const session = await requireSession(req, res, 'users.manage')
    if (!session) return
    const body = await buildCabinetUsersCsv()
    await writeAuditEvent({
      actorType: 'admin',
      actorId: session.user.id,
      action: 'member_users.export',
      ip,
      metadata: {bytes: body.length},
    })
    res.setHeader('content-type', 'text/csv; charset=utf-8')
    res.setHeader('content-disposition', 'attachment; filename="cabinet-users.csv"')
    return res.status(200).send(body)
  }

  if (parts[0] === 'member-users' && method === 'GET') {
    const session = await requireSession(req, res, 'users.manage')
    if (!session) return
    return res.status(200).json({
      items: await listMemberUsersAdmin(),
      accessLevels: [...ASSIGNABLE_ACCESS_LEVELS],
    })
  }

  if (parts[0] === 'member-users' && parts[1] && parts[2] === 'access-level' && method === 'PUT') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'users.manage')
    if (!session) return
    const body = parseJsonBody(req)
    const source = isRecord(body) ? body : {}
    const accessLevel = readStringOr(source.accessLevel, '')
    try {
      const user = await updateMemberUserAccessLevelAdmin(parts[1], accessLevel)
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'member_user.access_level',
        entityType: 'member_user',
        entityId: user.id,
        ip,
        metadata: {accessLevel: user.accessLevel},
      })
      return res.status(200).json({ok: true, user})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      return sendJsonError(res, 400, message)
    }
  }

  if (parts[0] === 'member-users' && parts[1] && parts[2] === 'roles' && method === 'PUT') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'users.manage')
    if (!session) return
    const body = parseJsonBody(req)
    const source = isRecord(body) ? body : {}
    const accessLevel =
      readStringOr(source.accessLevel, '') ||
      (Array.isArray(source.roles) ? String(source.roles[0] ?? 'member') : 'member')
    try {
      const user = await updateMemberUserAccessLevelAdmin(parts[1], accessLevel)
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'member_user.access_level',
        entityType: 'member_user',
        entityId: user.id,
        ip,
        metadata: {accessLevel: user.accessLevel},
      })
      return res.status(200).json({ok: true, user})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      return sendJsonError(res, 400, message)
    }
  }

  if (parts[0] === 'member-users' && method === 'POST' && !parts[1]) {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'users.manage')
    if (!session) return
    if (await isRateLimited(`admin:member-users:${session.user.id}`, 15 * 60 * 1000, 30)) {
      return sendJsonError(res, 429, 'Too many requests')
    }
    const body = parseJsonBody(req)
    const source = isRecord(body) ? body : {}
    const email = readStringOr(source.email, '')
    const password = readStringOr(source.password, '')
    const displayName = readStringOr(source.displayName, '')
    const memberIdRaw = readStringOr(source.memberId, '')
    const accessLevel =
      readStringOr(source.accessLevel, '') ||
      (Array.isArray(source.roles) ? String(source.roles[0] ?? 'member') : 'member')
    if (!email || !password) return sendJsonError(res, 400, 'email and password required')
    try {
      const user = await createMemberUser({
        email,
        password,
        displayName,
        memberId: memberIdRaw || null,
        accessLevel,
      })
      await writeAuditEvent({
        actorType: 'admin',
        actorId: session.user.id,
        action: 'member_user.create',
        entityType: 'member_user',
        entityId: user.id,
        ip,
        metadata: {memberId: user.memberId, accessLevel: user.accessLevel},
      })
      return res.status(200).json({ok: true, user})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Create failed'
      return sendJsonError(res, 400, message)
    }
  }

  if (parts[0] === 'member-users' && parts[1] && !parts[2] && method === 'DELETE') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'users.manage')
    if (!session) return
    if (await isRateLimited(`admin:member-users-delete:${session.user.id}`, 15 * 60 * 1000, 30)) {
      return sendJsonError(res, 429, 'Too many requests')
    }
    const deleted = await deleteMemberUserAdmin(parts[1])
    if (!deleted) return sendJsonError(res, 404, 'Member user not found')
    await writeAuditEvent({
      actorType: 'admin',
      actorId: session.user.id,
      action: 'member_user.delete',
      entityType: 'member_user',
      entityId: parts[1],
      ip,
    })
    return res.status(200).json({ok: true})
  }

  if (parts[0] === 'meetings' && parts[1] === 'list' && method === 'GET') {
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    return res.status(200).json({items: await listMeetingsAdmin()})
  }

  if (parts[0] === 'meetings' && parts[1] === 'reports' && method === 'GET') {
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    return res.status(200).json({items: await listReportsAdmin()})
  }

  if (parts[0] === 'meetings' && parts[1] === 'ops-settings' && method === 'GET') {
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    return res.status(200).json({settings: await getMeetingOpsSettings()})
  }

  if (parts[0] === 'meetings' && parts[1] === 'ops-settings' && method === 'PUT') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    const body = parseJsonBody(req)
    const settings = await putMeetingOpsSettings(body)
    await writeAuditEvent({
      actorType: 'admin',
      actorId: session.user.id,
      action: 'meeting_ops.settings',
      entityType: 'meeting_ops_settings',
      entityId: 'default',
      ip,
      metadata: {emails: settings.protocolNotifyEmails.length},
    })
    return res.status(200).json({settings})
  }

  if (parts[0] === 'meetings' && parts[1] === 'inbox' && method === 'GET') {
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    return res.status(200).json({items: await listPendingProviderEvents(50)})
  }

  if (parts[0] === 'meetings' && parts[1] === 'run-cron' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    const result = await processMeetingCronJobs()
    return res.status(200).json({ok: true, ...result})
  }

  if (parts[0] === 'provider-events' && parts[1] && parts[2] === 'process' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    const result = await processProviderEventById(parts[1])
    return res.status(200).json(result)
  }

  if (parts[0] === 'meetings' && parts[1] === 'process-inbox' && method === 'POST') {
    if (!requireMutationOrigin(req, res)) return
    const session = await requireSession(req, res, 'content.write')
    if (!session) return
    const body = parseJsonBody(req)
    const limit =
      isRecord(body) && typeof body.limit === 'number' ? Math.min(50, Math.max(1, body.limit)) : 10
    const result = await processInbox(limit)
    return res.status(200).json(result)
  }

  if (parts[0] === 'meetings' && parts[1] === 'providers' && method === 'GET') {
    const session = await requireSession(req, res, 'content.read')
    if (!session) return
    return res.status(200).json({
      known: MeetingProviderRegistry.listKnown(),
      implemented: MeetingProviderRegistry.listImplemented(),
    })
  }

  return sendJsonError(res, 404, 'Not found')
}

function csv(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

// silence unused in some builds
void (null as unknown as RouteResult)
