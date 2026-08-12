import {getSql} from '../db.js'
import type {ProviderEventStatus} from './types.js'

export type ProviderEventRow = {
  id: string
  provider: string
  externalEventType: string
  externalMeetingId: string
  externalOccurrenceId: string
  idempotencyKey: string
  payload: unknown
  status: ProviderEventStatus
  attempts: number
  lastError: string
  receivedAt: string
  processedAt: string | null
}

function mapEvent(row: Record<string, unknown>): ProviderEventRow {
  return {
    id: String(row.id),
    provider: String(row.provider),
    externalEventType: String(row.external_event_type ?? ''),
    externalMeetingId: String(row.external_meeting_id ?? ''),
    externalOccurrenceId: String(row.external_occurrence_id ?? ''),
    idempotencyKey: String(row.idempotency_key),
    payload: row.payload ?? {},
    status: String(row.status ?? 'pending') as ProviderEventStatus,
    attempts: Number(row.attempts ?? 0),
    lastError: String(row.last_error ?? ''),
    receivedAt: new Date(String(row.received_at)).toISOString(),
    processedAt: row.processed_at ? new Date(String(row.processed_at)).toISOString() : null,
  }
}

export async function insertProviderEvent(input: {
  provider: string
  externalEventType: string
  externalMeetingId: string
  externalOccurrenceId: string
  idempotencyKey: string
  payload: unknown
}): Promise<{row: ProviderEventRow; inserted: boolean}> {
  const sql = getSql()
  try {
    const rows = await sql`
      INSERT INTO meeting_provider_events (
        provider, external_event_type, external_meeting_id, external_occurrence_id,
        idempotency_key, payload, status
      ) VALUES (
        ${input.provider},
        ${input.externalEventType},
        ${input.externalMeetingId},
        ${input.externalOccurrenceId},
        ${input.idempotencyKey},
        ${JSON.stringify(input.payload ?? {})}::jsonb,
        'pending'
      )
      RETURNING *
    `
    return {row: mapEvent(rows[0] as Record<string, unknown>), inserted: true}
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!/unique|duplicate/i.test(message)) throw err
    const existing = await sql`
      SELECT * FROM meeting_provider_events WHERE idempotency_key = ${input.idempotencyKey} LIMIT 1
    `
    if (!existing[0]) throw err
    return {row: mapEvent(existing[0] as Record<string, unknown>), inserted: false}
  }
}

export async function getProviderEventById(id: string): Promise<ProviderEventRow | null> {
  const sql = getSql()
  const rows = await sql`SELECT * FROM meeting_provider_events WHERE id = ${id}::uuid LIMIT 1`
  return rows[0] ? mapEvent(rows[0] as Record<string, unknown>) : null
}

export async function claimProviderEvent(id: string): Promise<ProviderEventRow | null> {
  const sql = getSql()
  const claimed = await sql`
    UPDATE meeting_provider_events SET
      status = 'processing',
      attempts = attempts + 1
    WHERE id = ${id}::uuid AND status IN ('pending', 'failed')
    RETURNING *
  `
  return claimed[0] ? mapEvent(claimed[0] as Record<string, unknown>) : null
}

export async function completeProviderEvent(
  id: string,
  status: 'processed' | 'failed' | 'ignored',
  lastError = '',
): Promise<void> {
  const sql = getSql()
  const markDone = status === 'processed' || status === 'ignored'
  await sql`
    UPDATE meeting_provider_events SET
      status = ${status},
      last_error = ${lastError},
      processed_at = CASE WHEN ${markDone} THEN now() ELSE processed_at END
    WHERE id = ${id}::uuid
  `
}

export async function listPendingProviderEvents(limit = 20): Promise<ProviderEventRow[]> {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM meeting_provider_events
    WHERE status IN ('pending', 'failed')
    ORDER BY received_at ASC
    LIMIT ${limit}
  `
  return rows.map((row) => mapEvent(row as Record<string, unknown>))
}

/** Drops leftover Zoom/webhook inbox rows for a meeting that is being removed. */
export async function deleteProviderEventsForExternalMeeting(
  provider: string,
  externalMeetingId: string,
): Promise<number> {
  const externalId = externalMeetingId.trim()
  if (!externalId) return 0
  const sql = getSql()
  const rows = await sql`
    DELETE FROM meeting_provider_events
    WHERE provider = ${provider.trim().toLowerCase()}
      AND external_meeting_id = ${externalId}
    RETURNING id
  `
  return rows.length
}
