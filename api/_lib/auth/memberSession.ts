/**
 * Member portal auth — separate tables and cookie from admin.
 * Accounts are created by admin/ops (no public self-signup).
 */

import type {VercelRequest, VercelResponse} from '@vercel/node'
import {getSql} from '../db.js'
import {createSessionToken, hashPassword, hashToken, verifyPassword} from './crypto.js'
import {assertSameOrigin, assertValidNewPassword} from './session.js'
import {
  getMemberAccessLevel,
  setMemberAccessLevel,
} from '../meetings/memberRolesRepo.js'
import {
  isAssignableAccessLevel,
  maxAssignableLevel,
  type AssignableAccessLevel,
} from '../meetings/accessCore.js'

export const MEMBER_SESSION_COOKIE = 'uaos_member_session'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000

export type MemberUserRecord = {
  id: string
  email: string
  displayName: string
  memberId: string | null
  active: boolean
  accessLevel: AssignableAccessLevel
  mustChangePassword: boolean
  /** @deprecated Use accessLevel. Single-item array for older clients. */
  roles: string[]
}

export type MemberSessionContext = {
  user: MemberUserRecord
  sessionId: string
}

function mapUser(
  row: Record<string, unknown>,
  accessLevel: AssignableAccessLevel = 'member',
): MemberUserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name ?? ''),
    memberId: row.member_id == null ? null : String(row.member_id),
    active: Boolean(row.active),
    accessLevel,
    mustChangePassword: Boolean(row.must_change_password),
    roles: [accessLevel],
  }
}

function readCookie(req: VercelRequest, name: string): string | null {
  const raw = req.headers.cookie
  if (!raw) return null
  for (const part of raw.split(';')) {
    const [cookieName, ...rest] = part.trim().split('=')
    if (cookieName === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function readMemberSessionToken(req: VercelRequest): string | null {
  return readCookie(req, MEMBER_SESSION_COOKIE)
}

export function setMemberSessionCookie(res: VercelResponse, token: string, secure: boolean) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const parts = [
    `${MEMBER_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearMemberSessionCookie(res: VercelResponse, secure: boolean) {
  const parts = [
    `${MEMBER_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ]
  if (secure) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export async function findMemberUserByEmail(email: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM member_users WHERE lower(email) = ${email.trim().toLowerCase()} LIMIT 1
  `
  return rows[0] ? (rows[0] as Record<string, unknown>) : null
}

function resolveCreateLevel(input: {accessLevel?: string; roles?: string[]}): AssignableAccessLevel {
  if (input.accessLevel && isAssignableAccessLevel(input.accessLevel.trim().toLowerCase())) {
    return input.accessLevel.trim().toLowerCase() as AssignableAccessLevel
  }
  if (input.roles?.length) {
    return maxAssignableLevel(input.roles)
  }
  return 'member'
}

export async function createMemberUser(input: {
  email: string
  password: string
  displayName?: string
  memberId?: string | null
  accessLevel?: string
  roles?: string[]
  applicationId?: string | null
  mustChangePassword?: boolean
}): Promise<MemberUserRecord> {
  assertValidNewPassword(input.password)
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) throw new Error('Invalid email')

  const sql = getSql()
  const memberId = input.memberId?.trim() || null
  if (memberId) {
    const members = await sql`
      SELECT id FROM content_members WHERE id = ${memberId}::uuid LIMIT 1
    `
    if (!members[0]) throw new Error('Member profile not found')
  }

  const level = resolveCreateLevel(input)
  const passwordHash = hashPassword(input.password)
  const applicationId = input.applicationId?.trim() || null
  const mustChangePassword = input.mustChangePassword ?? false
  const rows = await sql`
    INSERT INTO member_users (
      email, display_name, password_hash, member_id, access_level,
      application_id, must_change_password
    )
    VALUES (
      ${email},
      ${input.displayName?.trim() ?? ''},
      ${passwordHash},
      ${memberId},
      ${level},
      ${applicationId},
      ${mustChangePassword}
    )
    RETURNING *
  `
  return mapUser(rows[0] as Record<string, unknown>, level)
}

export async function updateMemberPassword(
  memberUserId: string,
  currentPassword: string,
  newPassword: string,
): Promise<MemberUserRecord> {
  assertValidNewPassword(newPassword)
  const sql = getSql()
  const rows = await sql`SELECT * FROM member_users WHERE id = ${memberUserId}::uuid LIMIT 1`
  if (!rows[0]) throw new Error('Member user not found')
  const row = rows[0] as Record<string, unknown>
  if (!verifyPassword(currentPassword, String(row.password_hash))) {
    throw Object.assign(new Error('Invalid current password'), {status: 401})
  }
  const accessLevel = await getMemberAccessLevel(memberUserId)
  const passwordHash = hashPassword(newPassword)
  const updated = await sql`
    UPDATE member_users
    SET password_hash = ${passwordHash},
        must_change_password = false,
        updated_at = now()
    WHERE id = ${memberUserId}::uuid
    RETURNING *
  `
  return mapUser(updated[0] as Record<string, unknown>, accessLevel)
}

export async function updateMemberDisplayName(
  memberUserId: string,
  displayName: string,
): Promise<MemberUserRecord> {
  const sql = getSql()
  const trimmed = displayName.trim().slice(0, 200)
  const updated = await sql`
    UPDATE member_users
    SET display_name = ${trimmed}, updated_at = now()
    WHERE id = ${memberUserId}::uuid
    RETURNING *
  `
  if (!updated[0]) throw new Error('Member user not found')
  const accessLevel = await getMemberAccessLevel(memberUserId)
  return mapUser(updated[0] as Record<string, unknown>, accessLevel)
}

export async function authenticateMemberPassword(
  email: string,
  password: string,
): Promise<MemberUserRecord | null> {
  const row = await findMemberUserByEmail(email)
  if (!row || !row.active) return null
  if (row.locked_until && new Date(String(row.locked_until)).getTime() > Date.now()) {
    return null
  }
  if (!verifyPassword(password, String(row.password_hash))) {
    const sql = getSql()
    const fails = Number(row.failed_login_count ?? 0) + 1
    const lockUntil =
      fails >= 8 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
    await sql`
      UPDATE member_users
      SET failed_login_count = ${fails},
          locked_until = ${lockUntil},
          updated_at = now()
      WHERE id = ${String(row.id)}::uuid
    `
    return null
  }
  const sql = getSql()
  await sql`
    UPDATE member_users
    SET failed_login_count = 0, locked_until = NULL, updated_at = now()
    WHERE id = ${String(row.id)}::uuid
  `
  const accessLevel = await getMemberAccessLevel(String(row.id))
  return mapUser(row, accessLevel)
}

export async function createMemberSession(input: {
  userId: string
  ip: string
  userAgent: string
}): Promise<string> {
  const sql = getSql()
  const token = createSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await sql`
    INSERT INTO member_sessions (user_id, token_hash, expires_at, ip, user_agent)
    VALUES (${input.userId}::uuid, ${tokenHash}, ${expiresAt}, ${input.ip}, ${input.userAgent})
  `
  return token
}

export async function resolveMemberSession(token: string): Promise<MemberSessionContext | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT s.id AS session_id, u.*
    FROM member_sessions s
    JOIN member_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND u.active = true
    LIMIT 1
  `
  if (!rows[0]) return null
  const row = rows[0] as Record<string, unknown>
  const raw = String(row.access_level ?? 'member')
  const accessLevel = isAssignableAccessLevel(raw) ? raw : 'member'
  return {
    sessionId: String(row.session_id),
    user: mapUser(row, accessLevel),
  }
}

export async function revokeMemberSessionByToken(token: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE member_sessions
    SET revoked_at = now()
    WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL
  `
}

export async function listMemberUsersAdmin(): Promise<MemberUserRecord[]> {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM member_users ORDER BY created_at DESC LIMIT 500
  `
  return rows.map((row) => {
    const record = row as Record<string, unknown>
    const raw = String(record.access_level ?? 'member')
    const accessLevel = isAssignableAccessLevel(raw) ? raw : 'member'
    return mapUser(record, accessLevel)
  })
}

export async function updateMemberUserAccessLevelAdmin(
  memberUserId: string,
  accessLevel: string,
): Promise<MemberUserRecord> {
  const sql = getSql()
  const rows = await sql`SELECT * FROM member_users WHERE id = ${memberUserId}::uuid LIMIT 1`
  if (!rows[0]) throw new Error('Member user not found')
  const next = await setMemberAccessLevel(memberUserId, accessLevel)
  return mapUser(rows[0] as Record<string, unknown>, next)
}

/** @deprecated Prefer updateMemberUserAccessLevelAdmin */
export async function updateMemberUserRolesAdmin(
  memberUserId: string,
  roles: string[],
): Promise<MemberUserRecord> {
  const {maxAssignableLevel} = await import('../meetings/accessCore.js')
  const level = roles.length ? maxAssignableLevel(roles) : 'member'
  return updateMemberUserAccessLevelAdmin(memberUserId, level)
}

export {assertSameOrigin}
