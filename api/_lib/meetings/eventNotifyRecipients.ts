import {getSql} from '../db.js'
import {isAssignableAccessLevel, type AssignableAccessLevel} from './accessCore.js'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type NotifyPickerMode = 'by_role' | 'by_members'

export type EventNotifyRecipientInput = {
  memberUserId: string
  notifyMeeting: boolean
  notifyProtocol: boolean
}

export type CabinetDirectoryPerson = {
  id: string
  email: string
  displayName: string
  accessLevel: AssignableAccessLevel
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function parseNotifyPickerMode(value: unknown): NotifyPickerMode {
  return value === 'by_members' ? 'by_members' : 'by_role'
}

export function parseNotifyFilterRole(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!raw) return ''
  return isAssignableAccessLevel(raw) ? raw : ''
}

export function parseNotifyRecipients(value: unknown): EventNotifyRecipientInput[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: EventNotifyRecipientInput[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const memberUserId = String(record.memberUserId ?? record.member_user_id ?? '').trim()
    if (!isUuid(memberUserId) || seen.has(memberUserId)) continue
    const notifyMeeting = Boolean(record.notifyMeeting ?? record.notify_meeting)
    const notifyProtocol = Boolean(record.notifyProtocol ?? record.notify_protocol)
    if (!notifyMeeting && !notifyProtocol) continue
    seen.add(memberUserId)
    out.push({memberUserId, notifyMeeting, notifyProtocol})
    if (out.length >= 500) break
  }
  return out
}

export function mergeUniqueEmails(...groups: readonly (readonly string[])[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const group of groups) {
    for (const raw of group) {
      const email = raw.trim().toLowerCase()
      if (!email.includes('@') || seen.has(email)) continue
      seen.add(email)
      out.push(email)
    }
  }
  return out
}

export async function listCabinetDirectoryForNotify(): Promise<CabinetDirectoryPerson[]> {
  const sql = getSql()
  const rows = await sql`
    SELECT id, email, display_name, access_level
    FROM member_users
    WHERE active = true
    ORDER BY lower(email) ASC
    LIMIT 500
  `
  const people: CabinetDirectoryPerson[] = []
  for (const row of rows) {
    const record = row as Record<string, unknown>
    const raw = String(record.access_level ?? 'member')
    const accessLevel = isAssignableAccessLevel(raw) ? raw : 'member'
    people.push({
      id: String(record.id),
      email: String(record.email ?? ''),
      displayName: String(record.display_name ?? ''),
      accessLevel,
    })
  }
  return people
}

export async function listEventNotifyRecipients(
  eventId: string,
): Promise<EventNotifyRecipientInput[]> {
  if (!isUuid(eventId)) return []
  const sql = getSql()
  const rows = await sql`
    SELECT member_user_id, notify_meeting, notify_protocol
    FROM event_notify_recipients
    WHERE event_id = ${eventId}::uuid
  `
  return rows.map((row) => {
    const record = row as Record<string, unknown>
    return {
      memberUserId: String(record.member_user_id),
      notifyMeeting: Boolean(record.notify_meeting),
      notifyProtocol: Boolean(record.notify_protocol),
    }
  })
}

export async function listAllEventNotifyRecipients(): Promise<
  Map<string, EventNotifyRecipientInput[]>
> {
  const sql = getSql()
  const rows = await sql`
    SELECT event_id, member_user_id, notify_meeting, notify_protocol
    FROM event_notify_recipients
  `
  const map = new Map<string, EventNotifyRecipientInput[]>()
  for (const row of rows) {
    const record = row as Record<string, unknown>
    const eventId = String(record.event_id)
    const list = map.get(eventId) ?? []
    list.push({
      memberUserId: String(record.member_user_id),
      notifyMeeting: Boolean(record.notify_meeting),
      notifyProtocol: Boolean(record.notify_protocol),
    })
    map.set(eventId, list)
  }
  return map
}

export async function replaceEventNotifyRecipients(
  eventId: string,
  recipients: readonly EventNotifyRecipientInput[],
): Promise<void> {
  if (!isUuid(eventId)) throw new Error('Invalid event id')
  const sql = getSql()
  await sql`DELETE FROM event_notify_recipients WHERE event_id = ${eventId}::uuid`
  for (const item of recipients) {
    if (!item.notifyMeeting && !item.notifyProtocol) continue
    await sql`
      INSERT INTO event_notify_recipients (
        event_id, member_user_id, notify_meeting, notify_protocol
      )
      SELECT
        ${eventId}::uuid,
        id,
        ${item.notifyMeeting},
        ${item.notifyProtocol}
      FROM member_users
      WHERE id = ${item.memberUserId}::uuid
    `
  }
}

export async function listEventNotifyEmails(
  eventId: string,
  kind: 'meeting' | 'protocol',
): Promise<string[]> {
  if (!isUuid(eventId)) return []
  const sql = getSql()
  const rows =
    kind === 'meeting'
      ? await sql`
          SELECT mu.email
          FROM event_notify_recipients r
          JOIN member_users mu ON mu.id = r.member_user_id
          WHERE r.event_id = ${eventId}::uuid
            AND r.notify_meeting = true
            AND mu.active = true
        `
      : await sql`
          SELECT mu.email
          FROM event_notify_recipients r
          JOIN member_users mu ON mu.id = r.member_user_id
          WHERE r.event_id = ${eventId}::uuid
            AND r.notify_protocol = true
            AND mu.active = true
        `
  return mergeUniqueEmails(rows.map((row) => String((row as {email?: string}).email ?? '')))
}
