import {randomBytes, timingSafeEqual} from 'node:crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {getSql} from '../db.js'
import {createSessionToken, hashToken, verifyPassword} from './crypto.js'
import {roleRequiresMfa, type AdminRole} from './policy.js'
import {decryptSecret, encryptSecret, hashPassword} from './crypto.js'
import {buildOtpAuthUrl, generateTotpSecret, verifyTotpCode} from './totp.js'

export const SESSION_COOKIE = 'uaos_admin_session'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000
export const RECOVERY_MFA_TTL_MS = 30 * 60 * 1000
export const RECOVERY_MFA_TTL_MINUTES = 30

export interface AdminUserRecord {
  id: string
  email: string
  displayName: string
  role: AdminRole
  mfaEnabled: boolean
  active: boolean
}

export interface AdminSessionContext {
  user: AdminUserRecord
  sessionId: string
}

function mapUser(row: Record<string, unknown>): AdminUserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name ?? ''),
    role: String(row.role) as AdminRole,
    mfaEnabled: Boolean(row.mfa_enabled),
    active: Boolean(row.active),
  }
}

export function readSessionToken(req: VercelRequest): string | null {
  const raw = req.headers.cookie
  if (!raw) return null
  const parts = raw.split(';')
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=')
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function setSessionCookie(res: VercelResponse, token: string, secure: boolean) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearSessionCookie(res: VercelResponse, secure: boolean) {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ]
  if (secure) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export async function createAdminUser(input: {
  email: string
  password: string
  role: AdminRole
  displayName?: string
}): Promise<AdminUserRecord> {
  const sql = getSql()
  const passwordHash = hashPassword(input.password)
  const rows = await sql`
    INSERT INTO admin_users (email, display_name, password_hash, role)
    VALUES (
      ${input.email.trim().toLowerCase()},
      ${input.displayName ?? ''},
      ${passwordHash},
      ${input.role}
    )
    RETURNING *
  `
  return mapUser(rows[0] as Record<string, unknown>)
}

export async function findAdminByEmail(email: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM admin_users WHERE lower(email) = ${email.trim().toLowerCase()} LIMIT 1
  `
  return rows[0] ? (rows[0] as Record<string, unknown>) : null
}

export async function authenticatePassword(
  email: string,
  password: string,
): Promise<{user: AdminUserRecord; row: Record<string, unknown>} | null> {
  const row = await findAdminByEmail(email)
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
      UPDATE admin_users
      SET failed_login_count = ${fails},
          locked_until = ${lockUntil},
          updated_at = now()
      WHERE id = ${String(row.id)}::uuid
    `
    return null
  }
  const sql = getSql()
  await sql`
    UPDATE admin_users
    SET failed_login_count = 0, locked_until = NULL, updated_at = now()
    WHERE id = ${String(row.id)}::uuid
  `
  return {user: mapUser(row), row}
}

export async function createSession(input: {
  userId: string
  ip: string
  userAgent: string
}): Promise<string> {
  const sql = getSql()
  const token = createSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await sql`
    INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip, user_agent)
    VALUES (${input.userId}::uuid, ${tokenHash}, ${expiresAt}, ${input.ip}, ${input.userAgent})
  `
  return token
}

export async function revokeSessionByToken(token: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE admin_sessions
    SET revoked_at = now()
    WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL
  `
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE admin_sessions
    SET revoked_at = now()
    WHERE user_id = ${userId}::uuid AND revoked_at IS NULL
  `
}

export async function revokeOtherUserSessions(userId: string, keepSessionId: string): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE admin_sessions
    SET revoked_at = now()
    WHERE user_id = ${userId}::uuid
      AND id <> ${keepSessionId}::uuid
      AND revoked_at IS NULL
  `
}

const PASSWORD_MIN_LEN = 12
const PASSWORD_MAX_LEN = 128

/** Validates a new admin password without logging the value. */
export function assertValidNewPassword(password: string): void {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LEN) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LEN} characters`)
  }
  if (password.length > PASSWORD_MAX_LEN) {
    throw new Error('Password is too long')
  }
  if (/\s/.test(password)) {
    throw new Error('Password must not contain whitespace')
  }
}

/**
 * Changes password for the signed-in admin after verifying the current one.
 * Does not log password values. Caller should revoke other sessions.
 */
export async function changeAdminPassword(input: {
  userId: string
  currentPassword: string
  newPassword: string
}): Promise<void> {
  assertValidNewPassword(input.newPassword)
  if (input.currentPassword === input.newPassword) {
    throw new Error('New password must differ from the current password')
  }

  const sql = getSql()
  const rows = await sql`
    SELECT password_hash FROM admin_users
    WHERE id = ${input.userId}::uuid AND active = true
    LIMIT 1
  `
  const row = rows[0] as {password_hash?: unknown} | undefined
  if (!row?.password_hash) throw new Error('User not found')
  if (!verifyPassword(input.currentPassword, String(row.password_hash))) {
    throw new Error('Current password is incorrect')
  }

  const passwordHash = hashPassword(input.newPassword)
  await sql`
    UPDATE admin_users
    SET password_hash = ${passwordHash},
        failed_login_count = 0,
        locked_until = NULL,
        updated_at = now()
    WHERE id = ${input.userId}::uuid
  `
}

export async function resolveSession(token: string): Promise<AdminSessionContext | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT s.id AS session_id, u.*
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND u.active = true
    LIMIT 1
  `
  if (!rows[0]) return null
  const row = rows[0] as Record<string, unknown>
  return {
    sessionId: String(row.session_id),
    user: mapUser(row),
  }
}

export function getMfaEncKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.MFA_ENC_KEY?.trim()
  if (!key || key.length !== 64) {
    throw new Error('MFA_ENC_KEY must be 64 hex chars (32 bytes)')
  }
  return key
}

export async function beginMfaSetup(userId: string, email: string) {
  const secret = generateTotpSecret()
  const enc = encryptSecret(secret, getMfaEncKey())
  const sql = getSql()
  await sql`
    UPDATE admin_users
    SET mfa_secret_enc = ${enc}, mfa_enabled = false, updated_at = now()
    WHERE id = ${userId}::uuid
  `
  return {
    secret,
    otpauthUrl: buildOtpAuthUrl({secret, email}),
  }
}

export async function confirmMfaSetup(userId: string, code: string): Promise<boolean> {
  const sql = getSql()
  const rows = await sql`SELECT mfa_secret_enc FROM admin_users WHERE id = ${userId}::uuid LIMIT 1`
  const enc = rows[0]?.mfa_secret_enc
  if (!enc) return false
  const secret = decryptSecret(String(enc), getMfaEncKey())
  if (!verifyTotpCode(secret, code)) return false
  await sql`
    UPDATE admin_users
    SET mfa_enabled = true, updated_at = now()
    WHERE id = ${userId}::uuid
  `
  return true
}

/**
 * Temporary password for email recovery. Meets assertValidNewPassword rules.
 * Ambiguous characters (0/O/1/l/I) are avoided for easier typing from email.
 */
export function generateTempAdminPassword(bytes: () => Buffer = () => randomBytes(18)): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*'
  const raw = bytes()
  let out = ''
  for (let i = 0; i < raw.length; i += 1) {
    out += alphabet[raw[i]! % alphabet.length]
  }
  if (out.length < PASSWORD_MIN_LEN) {
    throw new Error('Failed to generate temporary password')
  }
  return out.slice(0, 20)
}

/** Six-digit one-time MFA code for email recovery (not Authenticator TOTP). */
export function generateRecoveryMfaCode(bytes: () => Buffer = () => randomBytes(4)): string {
  const n = bytes().readUInt32BE(0) % 1_000_000
  return String(n).padStart(6, '0')
}

export function hashRecoveryMfaCode(code: string): string {
  return hashToken(code.trim())
}

export function recoveryMfaHashesEqual(expectedHash: string, code: string): boolean {
  const actual = hashRecoveryMfaCode(code)
  const a = Buffer.from(expectedHash, 'hex')
  const b = Buffer.from(actual, 'hex')
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}

/**
 * Resets password to a temporary value and stores a hashed one-time MFA code.
 * Caller must email the plaintext values and revoke sessions.
 */
export async function applyAdminPasswordRecovery(input: {
  userId: string
  tempPassword: string
  recoveryMfaCode: string | null
}): Promise<void> {
  assertValidNewPassword(input.tempPassword)
  const sql = getSql()
  const passwordHash = hashPassword(input.tempPassword)
  const mfaHash = input.recoveryMfaCode ? hashRecoveryMfaCode(input.recoveryMfaCode) : null
  const mfaExpires = input.recoveryMfaCode
    ? new Date(Date.now() + RECOVERY_MFA_TTL_MS).toISOString()
    : null

  await sql`
    UPDATE admin_users
    SET password_hash = ${passwordHash},
        recovery_mfa_hash = ${mfaHash},
        recovery_mfa_expires_at = ${mfaExpires},
        failed_login_count = 0,
        locked_until = NULL,
        updated_at = now()
    WHERE id = ${input.userId}::uuid
  `
}

export async function consumeRecoveryMfaCode(userId: string, code: string): Promise<boolean> {
  const normalized = code.trim().replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalized)) return false

  const sql = getSql()
  const rows = await sql`
    SELECT recovery_mfa_hash, recovery_mfa_expires_at
    FROM admin_users WHERE id = ${userId}::uuid LIMIT 1
  `
  const row = rows[0] as
    | {recovery_mfa_hash?: unknown; recovery_mfa_expires_at?: unknown}
    | undefined
  if (!row?.recovery_mfa_hash || !row.recovery_mfa_expires_at) return false
  if (new Date(String(row.recovery_mfa_expires_at)).getTime() < Date.now()) return false
  if (!recoveryMfaHashesEqual(String(row.recovery_mfa_hash), normalized)) return false

  await sql`
    UPDATE admin_users
    SET recovery_mfa_hash = NULL,
        recovery_mfa_expires_at = NULL,
        updated_at = now()
    WHERE id = ${userId}::uuid
  `
  return true
}

export async function verifyUserMfa(userId: string, code: string): Promise<boolean> {
  if (await consumeRecoveryMfaCode(userId, code)) return true

  const sql = getSql()
  const rows = await sql`
    SELECT mfa_secret_enc, mfa_enabled, role
    FROM admin_users WHERE id = ${userId}::uuid LIMIT 1
  `
  const row = rows[0]
  if (!row) return false
  if (!row.mfa_enabled) {
    // MFA not yet enabled: allow password-only only for editor role that does not require MFA
    return !roleRequiresMfa(String(row.role) as AdminRole)
  }
  if (!row.mfa_secret_enc) return false
  const secret = decryptSecret(String(row.mfa_secret_enc), getMfaEncKey())
  return verifyTotpCode(secret, code)
}

export function assertSameOrigin(req: VercelRequest, env: NodeJS.ProcessEnv = process.env): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const referer = typeof req.headers.referer === 'string' ? req.headers.referer : ''
  const allowed = (env.SITE_URL || env.APP_URL || '').replace(/\/$/, '')
  if (!allowed) {
    // Local/dev without SITE_URL: accept missing origin (same-origin navigations)
    return !origin || origin.includes('localhost') || origin.includes('127.0.0.1')
  }
  if (origin) return origin.replace(/\/$/, '') === allowed
  if (referer) return referer.startsWith(allowed)
  return false
}
