import {getSql, isDatabaseConfigured} from './db'

export async function writeAuditEvent(input: {
  actorType: string
  actorId?: string
  action: string
  entityType?: string
  entityId?: string
  ip?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  if (!isDatabaseConfigured()) return
  const sql = getSql()
  await sql`
    INSERT INTO audit_events (actor_type, actor_id, action, entity_type, entity_id, ip, metadata)
    VALUES (
      ${input.actorType},
      ${input.actorId ?? ''},
      ${input.action},
      ${input.entityType ?? ''},
      ${input.entityId ?? ''},
      ${input.ip ?? ''},
      ${JSON.stringify(input.metadata ?? {})}::jsonb
    )
  `
}
