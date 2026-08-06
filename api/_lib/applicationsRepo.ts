import {getSql} from './db.js'
import type {NormalizedJoinApplication} from './joinApplication.js'
import {MEMBERSHIP_TERMS_PURPOSE} from '../../src/lib/siteTerms.js'

export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected'

export interface ApplicationRecord {
  id: string
  status: ApplicationStatus
  companyName: string
  website: string
  activityField: string
  edrpou: string
  contactPerson: string
  email: string
  phone: string
  message: string
  applicantKind: string
  sectors: string[]
  productCategories: string[]
  competencies: string[]
  consentIp: string
  submittedAt: string
  createdAt: string
  updatedAt: string
}

export interface ApplicationStats {
  total: number
  byStatus: Array<{key: string; count: number}>
  byApplicantKind: Array<{key: string; count: number}>
  bySector: Array<{key: string; count: number}>
}

function mapRow(row: Record<string, unknown>): ApplicationRecord {
  return {
    id: String(row.id),
    status: String(row.status) as ApplicationStatus,
    companyName: String(row.company_name ?? ''),
    website: String(row.website ?? ''),
    activityField: String(row.activity_field ?? ''),
    edrpou: String(row.edrpou ?? ''),
    contactPerson: String(row.contact_person ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    message: String(row.message ?? ''),
    applicantKind: String(row.applicant_kind ?? ''),
    sectors: Array.isArray(row.sectors) ? row.sectors.map(String) : [],
    productCategories: Array.isArray(row.product_categories)
      ? row.product_categories.map(String)
      : [],
    competencies: Array.isArray(row.competencies) ? row.competencies.map(String) : [],
    consentIp: String(row.consent_ip ?? ''),
    submittedAt: new Date(String(row.submitted_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }
}

/** UTC day bucket for anti-duplicate key. */
export function buildApplicationDedupeKey(email: string, edrpou: string, submittedAtIso: string): string {
  const day = submittedAtIso.slice(0, 10)
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedEdrpou = edrpou.replace(/\D/g, '')
  return `${normalizedEmail}|${normalizedEdrpou}|${day}`
}

export async function createApplication(input: {
  payload: NormalizedJoinApplication
  website: string
  consentIp: string
  policyVersion: string
  termsVersion: string
  noticeLanguage: string
  userAgent: string
}): Promise<{application: ApplicationRecord; duplicate: boolean}> {
  const sql = getSql()
  const dedupeKey = buildApplicationDedupeKey(
    input.payload.email,
    input.payload.edrpou,
    input.payload.consentTimestamp,
  )

  const existing = await sql`
    SELECT * FROM applications WHERE dedupe_key = ${dedupeKey} LIMIT 1
  `
  if (existing[0]) {
    return {application: mapRow(existing[0] as Record<string, unknown>), duplicate: true}
  }

  const inserted = await sql`
    INSERT INTO applications (
      status, company_name, website, activity_field, edrpou, contact_person,
      email, phone, message, applicant_kind, sectors, product_categories,
      competencies, consent_ip, submitted_at, dedupe_key
    ) VALUES (
      'pending',
      ${input.payload.companyName},
      ${input.website},
      ${input.payload.activityField},
      ${input.payload.edrpou || ''},
      ${input.payload.contactPerson},
      ${input.payload.email},
      ${input.payload.phone},
      ${input.payload.message || ''},
      ${input.payload.applicantKind || ''},
      ${input.payload.sectors},
      ${input.payload.productCategories},
      ${input.payload.competencies},
      ${input.consentIp},
      ${input.payload.consentTimestamp},
      ${dedupeKey}
    )
    RETURNING *
  `

  const application = mapRow(inserted[0] as Record<string, unknown>)

  await sql`
    INSERT INTO consents (
      application_id, purpose_code, legal_basis, policy_version,
      notice_language, accepted_at, source, ip, user_agent
    ) VALUES (
      ${application.id}::uuid,
      'membership_application',
      'consent',
      ${input.policyVersion},
      ${input.noticeLanguage},
      ${input.payload.consentTimestamp},
      'join_form',
      ${input.consentIp},
      ${input.userAgent}
    )
  `

  await sql`
    INSERT INTO consents (
      application_id, purpose_code, legal_basis, policy_version,
      notice_language, accepted_at, source, ip, user_agent
    ) VALUES (
      ${application.id}::uuid,
      ${MEMBERSHIP_TERMS_PURPOSE},
      'consent',
      ${input.termsVersion},
      ${input.noticeLanguage},
      ${input.payload.consentTimestamp},
      'join_form',
      ${input.consentIp},
      ${input.userAgent}
    )
  `

  return {application, duplicate: false}
}

export async function listApplications(filters: {
  status?: ApplicationStatus | 'all'
  applicantKind?: string
  sector?: string
  limit?: number
  offset?: number
}): Promise<ApplicationRecord[]> {
  const sql = getSql()
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500)
  const offset = Math.max(filters.offset ?? 0, 0)
  const status = filters.status && filters.status !== 'all' ? filters.status : null
  const kind = filters.applicantKind?.trim() || null
  const sector = filters.sector?.trim() || null

  const rows = await sql`
    SELECT * FROM applications
    WHERE (${status}::text IS NULL OR status = ${status})
      AND (${kind}::text IS NULL OR applicant_kind = ${kind})
      AND (${sector}::text IS NULL OR ${sector} = ANY(sectors))
    ORDER BY submitted_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `
  return rows.map((row) => mapRow(row as Record<string, unknown>))
}

export async function getApplicationById(id: string): Promise<ApplicationRecord | null> {
  const sql = getSql()
  const rows = await sql`SELECT * FROM applications WHERE id = ${id}::uuid LIMIT 1`
  if (!rows[0]) return null
  return mapRow(rows[0] as Record<string, unknown>)
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<ApplicationRecord | null> {
  const sql = getSql()
  const rows = await sql`
    UPDATE applications
    SET status = ${status}, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `
  if (!rows[0]) return null
  return mapRow(rows[0] as Record<string, unknown>)
}

const DELETABLE_STATUSES: ApplicationStatus[] = ['accepted', 'rejected']

/** Deletes one accepted/rejected application. Consents keep a null application_id. */
export async function deleteClosedApplication(id: string): Promise<ApplicationRecord | null> {
  const sql = getSql()
  const existing = await getApplicationById(id)
  if (!existing) return null
  if (!DELETABLE_STATUSES.includes(existing.status)) {
    throw new Error('Only accepted or rejected applications can be deleted')
  }
  await sql`DELETE FROM applications WHERE id = ${id}::uuid`
  return existing
}

/** Deletes all accepted and rejected applications. Returns deleted count. */
export async function deleteClosedApplications(): Promise<number> {
  const sql = getSql()
  const rows = await sql`
    DELETE FROM applications
    WHERE status IN ('accepted', 'rejected')
    RETURNING id
  `
  return rows.length
}

export async function getApplicationStats(fromIso: string | null): Promise<ApplicationStats> {
  const sql = getSql()
  const totalRows = await sql`
    SELECT count(*)::int AS count FROM applications
    WHERE (${fromIso}::timestamptz IS NULL OR submitted_at >= ${fromIso}::timestamptz)
  `
  const byStatus = await sql`
    SELECT coalesce(status, 'unknown') AS key, count(*)::int AS count
    FROM applications
    WHERE (${fromIso}::timestamptz IS NULL OR submitted_at >= ${fromIso}::timestamptz)
    GROUP BY status
    ORDER BY count DESC
  `
  const byKind = await sql`
    SELECT coalesce(nullif(applicant_kind, ''), 'unknown') AS key, count(*)::int AS count
    FROM applications
    WHERE (${fromIso}::timestamptz IS NULL OR submitted_at >= ${fromIso}::timestamptz)
    GROUP BY 1
    ORDER BY count DESC
  `
  const bySector = await sql`
    SELECT coalesce(sector, 'unknown') AS key, count(*)::int AS count
    FROM applications,
      LATERAL unnest(
        CASE WHEN cardinality(sectors) > 0 THEN sectors ELSE ARRAY['unknown']::text[] END
      ) AS sector
    WHERE (${fromIso}::timestamptz IS NULL OR submitted_at >= ${fromIso}::timestamptz)
    GROUP BY 1
    ORDER BY count DESC
  `

  return {
    total: Number(totalRows[0]?.count ?? 0),
    byStatus: byStatus.map((row) => ({key: String(row.key), count: Number(row.count)})),
    byApplicantKind: byKind.map((row) => ({key: String(row.key), count: Number(row.count)})),
    bySector: bySector.map((row) => ({key: String(row.key), count: Number(row.count)})),
  }
}
