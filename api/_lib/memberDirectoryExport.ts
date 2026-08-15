import {getSql} from './db.js'
import {buildExcelCsv, csvExcelText} from './csvExcel.js'
import {
  catalogGroupLabels,
  primaryMemberCatalogGroupId,
  type MemberCatalogGroupId,
} from './memberCatalogGroups.js'

function isoDate(value: unknown): string {
  if (!value) return ''
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function groupSortKey(groupId: MemberCatalogGroupId): number {
  const order: MemberCatalogGroupId[] = [
    'consumers',
    'suppliers',
    'experts',
    'institutions',
    'gr-partners',
    'other',
  ]
  const idx = order.indexOf(groupId)
  return idx >= 0 ? idx : 99
}

/** Catalogue members CSV, sorted by public catalogue groups. Excel-friendly (BOM + `;`). */
export async function buildContentMembersCatalogCsv(): Promise<string> {
  const sql = getSql()
  const rows = await sql`
    SELECT
      id, slug, status, sort_order,
      name_uk, name_en, public_email, public_phone, website_url, region,
      participant_types, created_at, updated_at
    FROM content_members
    ORDER BY sort_order ASC, updated_at DESC
  `

  type RowOut = {
    groupId: MemberCatalogGroupId
    groupUk: string
    groupEn: string
    status: string
    nameUk: string
    nameEn: string
    email: string
    phone: string
    website: string
    region: string
    participantTypes: string
    memberSince: string
    updatedAt: string
    slug: string
  }

  const out: RowOut[] = []
  for (const raw of rows) {
    const row = raw as Record<string, unknown>
    const types = Array.isArray(row.participant_types)
      ? row.participant_types.map(String)
      : []
    const groupId = primaryMemberCatalogGroupId(types)
    const labels = catalogGroupLabels(groupId)
    out.push({
      groupId,
      groupUk: labels.uk,
      groupEn: labels.en,
      status: String(row.status ?? ''),
      nameUk: String(row.name_uk ?? ''),
      nameEn: String(row.name_en ?? ''),
      email: String(row.public_email ?? ''),
      phone: String(row.public_phone ?? ''),
      website: String(row.website_url ?? ''),
      region: String(row.region ?? ''),
      participantTypes: types.join('|'),
      memberSince: isoDate(row.created_at),
      updatedAt: isoDate(row.updated_at),
      slug: String(row.slug ?? ''),
    })
  }

  out.sort((a, b) => {
    const byGroup = groupSortKey(a.groupId) - groupSortKey(b.groupId)
    if (byGroup !== 0) return byGroup
    return a.nameUk.localeCompare(b.nameUk, 'uk')
  })

  const header = [
    'ID групи',
    'Група (UK)',
    'Група (EN)',
    'Статус',
    'Назва (UK)',
    'Назва (EN)',
    'Email',
    'Телефон',
    'Вебсайт',
    'Регіон',
    'Типи учасників',
    'Учасник з',
    'Оновлено',
    'Slug',
  ]
  return buildExcelCsv(
    header,
    out.map((item) => [
      item.groupId,
      item.groupUk,
      item.groupEn,
      item.status,
      item.nameUk,
      item.nameEn,
      item.email,
      csvExcelText(item.phone),
      item.website,
      item.region,
      item.participantTypes,
      item.memberSince,
      item.updatedAt,
      item.slug,
    ]),
  )
}

/**
 * Cabinet accounts CSV for accounting: who + since when, grouped by catalogue group
 * when application applicant_kind is known.
 */
export async function buildCabinetUsersCsv(): Promise<string> {
  const sql = getSql()
  const rows = await sql`
    SELECT
      mu.id,
      mu.email,
      mu.display_name,
      mu.access_level,
      mu.active,
      mu.created_at,
      mu.application_id,
      a.company_name,
      a.phone AS application_phone,
      a.applicant_kind,
      a.status AS application_status,
      a.submitted_at
    FROM member_users mu
    LEFT JOIN applications a ON a.id = mu.application_id
    ORDER BY mu.created_at DESC
    LIMIT 2000
  `

  type RowOut = {
    groupId: MemberCatalogGroupId
    groupUk: string
    groupEn: string
    email: string
    displayName: string
    companyName: string
    phone: string
    accessLevel: string
    active: string
    memberSince: string
    applicationStatus: string
    applicantKind: string
    applicationSubmittedAt: string
  }

  const out: RowOut[] = []
  for (const raw of rows) {
    const row = raw as Record<string, unknown>
    const applicantKind = String(row.applicant_kind ?? '')
    const groupId = primaryMemberCatalogGroupId(applicantKind ? [applicantKind] : [])
    const labels = catalogGroupLabels(groupId)
    out.push({
      groupId,
      groupUk: labels.uk,
      groupEn: labels.en,
      email: String(row.email ?? ''),
      displayName: String(row.display_name ?? ''),
      companyName: String(row.company_name ?? ''),
      phone: String(row.application_phone ?? ''),
      accessLevel: String(row.access_level ?? 'member'),
      active: Boolean(row.active) ? 'true' : 'false',
      memberSince: isoDate(row.created_at),
      applicationStatus: String(row.application_status ?? ''),
      applicantKind,
      applicationSubmittedAt: isoDate(row.submitted_at),
    })
  }

  out.sort((a, b) => {
    const byGroup = groupSortKey(a.groupId) - groupSortKey(b.groupId)
    if (byGroup !== 0) return byGroup
    return a.memberSince.localeCompare(b.memberSince)
  })

  const header = [
    'ID групи',
    'Група (UK)',
    'Група (EN)',
    'Email',
    'Імʼя',
    'Компанія',
    'Телефон',
    'Рівень доступу',
    'Активний',
    'Учасник з',
    'Статус заявки',
    'Тип заявника',
    'Дата подання заявки',
  ]
  return buildExcelCsv(
    header,
    out.map((item) => [
      item.groupId,
      item.groupUk,
      item.groupEn,
      item.email,
      item.displayName,
      item.companyName,
      csvExcelText(item.phone),
      item.accessLevel,
      item.active,
      item.memberSince,
      item.applicationStatus,
      item.applicantKind,
      item.applicationSubmittedAt,
    ]),
  )
}
