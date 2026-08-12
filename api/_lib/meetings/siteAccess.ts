import type {VercelRequest} from '@vercel/node'
import {readSessionToken, resolveSession} from '../auth/session.js'
import {readMemberSessionToken, resolveMemberSession} from '../auth/memberSession.js'
import type {AccessLevel} from './accessCore.js'

export type SiteAccessContext = {
  level: AccessLevel | null
  source: 'admin' | 'member' | 'anonymous'
  memberUserId: string | null
  adminUserId: string | null
}

/**
 * Effective site access: admin session ⇒ superadmin; else member access_level; else anonymous.
 */
export async function resolveSiteAccess(req: VercelRequest): Promise<SiteAccessContext> {
  const adminToken = readSessionToken(req)
  if (adminToken) {
    const admin = await resolveSession(adminToken)
    if (admin) {
      return {
        level: 'superadmin',
        source: 'admin',
        memberUserId: null,
        adminUserId: admin.user.id,
      }
    }
  }

  const memberToken = readMemberSessionToken(req)
  if (memberToken) {
    const member = await resolveMemberSession(memberToken)
    if (member) {
      const level = member.user.accessLevel as AccessLevel
      return {
        level,
        source: 'member',
        memberUserId: member.user.id,
        adminUserId: null,
      }
    }
  }

  return {
    level: null,
    source: 'anonymous',
    memberUserId: null,
    adminUserId: null,
  }
}
