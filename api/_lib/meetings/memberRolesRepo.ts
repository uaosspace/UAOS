import {getSql} from '../db.js'
import {
  isAssignableAccessLevel,
  maxAssignableLevel,
  resolveEventNotifyLevels,
  type AssignableAccessLevel,
} from './accessCore.js'

export async function getMemberAccessLevel(memberUserId: string): Promise<AssignableAccessLevel> {
  const sql = getSql()
  const rows = await sql`
    SELECT access_level FROM member_users WHERE id = ${memberUserId}::uuid LIMIT 1
  `
  const raw = String((rows[0] as {access_level?: string} | undefined)?.access_level ?? 'member')
  return isAssignableAccessLevel(raw) ? raw : 'member'
}

export async function setMemberAccessLevel(
  memberUserId: string,
  level: string,
): Promise<AssignableAccessLevel> {
  const normalized = level.trim().toLowerCase()
  if (!isAssignableAccessLevel(normalized)) {
    throw new Error('Invalid access level')
  }
  const sql = getSql()
  await sql`
    UPDATE member_users
    SET access_level = ${normalized}, updated_at = now()
    WHERE id = ${memberUserId}::uuid
  `
  return normalized
}

export async function listMemberEmailsForEventNotify(minRole: string): Promise<string[]> {
  const allowed = new Set(resolveEventNotifyLevels(minRole))
  const sql = getSql()
  const rows = await sql`
    SELECT email, access_level FROM member_users WHERE active = true
  `
  const seen = new Set<string>()
  const emails: string[] = []
  for (const row of rows) {
    const record = row as {email: string; access_level: string}
    const level = record.access_level.trim().toLowerCase()
    if (!allowed.has(level as AssignableAccessLevel)) continue
    const email = String(record.email).trim().toLowerCase()
    if (!email.includes('@') || seen.has(email)) continue
    seen.add(email)
    emails.push(email)
  }
  return emails
}

/** @deprecated Use listMemberEmailsForEventNotify */
export async function listMemberEmailsAtOrAbove(minRole: string): Promise<string[]> {
  return listMemberEmailsForEventNotify(minRole)
}

/** @deprecated Compatibility wrappers during ladder migration. */
export async function listMemberUserRoles(memberUserId: string): Promise<string[]> {
  return [await getMemberAccessLevel(memberUserId)]
}

export async function replaceMemberUserRoles(
  memberUserId: string,
  roles: string[],
): Promise<string[]> {
  const level = roles.length ? maxAssignableLevel(roles) : 'member'
  await setMemberAccessLevel(memberUserId, level)
  return [level]
}
