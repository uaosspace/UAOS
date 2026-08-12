/**
 * Content repository — Neon tables for public CMS entities.
 */
import {getSql} from './db.js'
import {isRecord, readStringOr} from '../../src/lib/contentGuards.js'
import {releaseOwnedMediaIfUnused} from './mediaCleanup.js'
import {
  clampOptionalText,
  normalizeLocalizedText,
  normalizeOptionalHttpUrl,
  normalizeOptionalMediaUrl,
  normalizeOptionalPublicEmail,
  normalizeOptionalPublicPhone,
  normalizeParticipationMode,
  requireNonEmptyText,
  type LocalizedInput,
} from './contentValidation.js'
import {canViewEvent} from './meetings/accessCore.js'

/** Localized payload sent to clients: `uk`/`en` always present, extra locales when translated. */
type LocalizedOutput = {uk: string; en: string} & Record<string, string>

function readJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function readJsonObject(value: unknown): Record<string, unknown> {
  if (isRecord(value) && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return isRecord(parsed) && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Localized field read. The `*_i18n` JSONB column is authoritative; the legacy `*_uk`/`*_en`
 * columns are the fallback for rows written before migration 005 or by an older deployment
 * that still only knows about the text columns.
 */
export function readLocalizedColumn(
  jsonValue: unknown,
  legacyUk: unknown,
  legacyEn: unknown,
): LocalizedOutput {
  const localized: Record<string, string> = {}
  for (const [locale, value] of Object.entries(readJsonObject(jsonValue))) {
    if (typeof value === 'string' && value.trim()) localized[locale] = value
  }
  return {
    ...localized,
    uk: localized.uk || String(legacyUk ?? ''),
    en: localized.en || String(legacyEn ?? ''),
  }
}

/** Same fallback rule for list fields stored as `[{uk, en, …}]` next to a legacy TEXT[] column. */
function readLocalizedArrayColumn(jsonValue: unknown, legacyValue: unknown): unknown[] {
  const items = readJsonArray(jsonValue)
  if (items.length) return items
  return Array.isArray(legacyValue) ? legacyValue.map(String) : []
}

/**
 * Values bound into an upsert. `null` means "field absent from the payload": UPDATE keeps the stored
 * value via COALESCE. Without this a form that does not render every locale-aware field (admin has
 * no fullDescription/location inputs) would erase translations it never loaded.
 */
type LocalizedWrite = {json: string | null; uk: string | null; en: string | null}

function localizedWrite(
  raw: unknown,
  fieldName: string,
  maxLen: number,
  options: {required?: boolean} = {},
): LocalizedWrite {
  if (raw === undefined && !options.required) return {json: null, uk: null, en: null}
  const value: LocalizedInput = normalizeLocalizedText(raw, fieldName, maxLen, options)
  return {json: JSON.stringify(value), uk: value.uk ?? '', en: value.en ?? ''}
}

export async function listPublishedMembers() {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM content_members
    WHERE status = 'published'
    ORDER BY sort_order ASC, updated_at DESC
  `
  return rows.map(mapMemberPublic)
}

export async function listPublishedNews() {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM content_news
    WHERE status = 'published'
    ORDER BY published_at DESC NULLS LAST
    LIMIT 50
  `
  return rows.map(mapNewsPublic)
}

export async function listPublishedEvents(userLevel: string | null = null) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM content_events
    WHERE status = 'published'
    ORDER BY start_at ASC
  `
  return rows
    .map((row) => mapEventPublic(row as Record<string, unknown>))
    .filter((event) =>
      canViewEvent({
        visibility: event.visibility,
        accessMinRole: event.accessMinRole,
        userLevel,
      }),
    )
}

export async function getPublishedEventBySlug(slug: string) {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM content_events
    WHERE status = 'published' AND slug = ${slug}
    LIMIT 1
  `
  if (!rows[0]) return null
  return mapEventPublic(rows[0] as Record<string, unknown>)
}

export async function listPublishedDocuments() {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM content_documents
    WHERE status = 'published' AND access_level = 'public'
    ORDER BY date_updated DESC NULLS LAST
  `
  return rows.map(mapDocumentPublic)
}

export async function getPublishedSiteSettings() {
  const sql = getSql()
  const rows = await sql`SELECT * FROM site_settings WHERE id = 'siteSettings' LIMIT 1`
  if (!rows[0]) {
    return {
      phone: '',
      email: '',
      address: {uk: '', en: ''},
      brandTagline: {uk: '', en: ''},
      statsShowOnSite: false,
      statsMembersValue: '',
      statsProducersValue: '',
      statsProjectsValue: '',
      statsYearsValue: '',
    }
  }
  const row = rows[0] as Record<string, unknown>
  return {
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    address: readLocalizedColumn(row.address_i18n, row.address_uk, row.address_en),
    brandTagline: readLocalizedColumn(
      row.brand_tagline_i18n,
      row.brand_tagline_uk,
      row.brand_tagline_en,
    ),
    statsShowOnSite: Boolean(row.stats_show_on_site),
    statsMembersValue: String(row.stats_members_value ?? ''),
    statsProducersValue: String(row.stats_producers_value ?? ''),
    statsProjectsValue: String(row.stats_projects_value ?? ''),
    statsYearsValue: String(row.stats_years_value ?? ''),
  }
}

function mapMemberPublic(row: Record<string, unknown>) {
  const shortName = readLocalizedColumn(row.short_name_i18n, row.short_name_uk, row.short_name_en)
  return {
    id: String(row.id),
    slug: String(row.slug),
    published: true,
    order: Number(row.sort_order ?? 0),
    profileLevel: String(row.profile_level ?? 'basic'),
    name: readLocalizedColumn(row.name_i18n, row.name_uk, row.name_en),
    // Brand abbreviation, not translated: the client model keeps `shortName` a plain string.
    shortName: shortName.uk || shortName.en,
    category: readLocalizedColumn(row.category_i18n, row.category_uk, row.category_en),
    shortDescription: readLocalizedColumn(
      row.short_description_i18n,
      row.short_description_uk,
      row.short_description_en,
    ),
    fullDescription: readLocalizedColumn(
      row.full_description_i18n,
      row.full_description_uk,
      row.full_description_en,
    ),
    logoUrl: String(row.logo_url ?? ''),
    coverImageUrl: String(row.cover_url ?? ''),
    websiteUrl: String(row.website_url ?? ''),
    publicEmail: String(row.public_email ?? ''),
    publicPhone: String(row.public_phone ?? ''),
    participantTypes: Array.isArray(row.participant_types) ? row.participant_types.map(String) : [],
    sectors: Array.isArray(row.sectors) ? row.sectors.map(String) : [],
    productCategories: Array.isArray(row.product_categories)
      ? row.product_categories.map(String)
      : [],
    competencies: readLocalizedArrayColumn(row.competencies_i18n, row.competencies),
    region: String(row.region ?? ''),
    featured: Boolean(row.featured),
    services: readJsonArray(row.services),
    certificates: readJsonArray(row.certificates),
    cases: readJsonArray(row.cases),
    products: readJsonArray(row.products),
  }
}

function mapNewsPublic(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    published: true,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : '',
    title: readLocalizedColumn(row.title_i18n, row.title_uk, row.title_en),
    excerpt: readLocalizedColumn(row.excerpt_i18n, row.excerpt_uk, row.excerpt_en),
    body: readLocalizedColumn(row.body_i18n, row.body_uk, row.body_en),
    coverImageUrl: String(row.cover_url ?? ''),
    externalUrl: String(row.external_url ?? ''),
  }
}

function mapEventPublic(row: Record<string, unknown>) {
  return {
    id: String(row.slug || row.id),
    published: true,
    title: readLocalizedColumn(row.title_i18n, row.title_uk, row.title_en),
    shortDescription: readLocalizedColumn(
      row.short_description_i18n,
      row.short_description_uk,
      row.short_description_en,
    ),
    fullDescription: readLocalizedColumn(
      row.full_description_i18n,
      row.full_description_uk,
      row.full_description_en,
    ),
    type: String(row.event_type ?? 'meeting'),
    format: String(row.event_format ?? 'online'),
    startAt: new Date(String(row.start_at)).toISOString(),
    endAt: row.end_at ? new Date(String(row.end_at)).toISOString() : null,
    timeZone: String(row.time_zone ?? 'Europe/Kyiv'),
    location: readLocalizedColumn(row.location_i18n, row.location, row.location),
    // Manual external link only — never provider start_url / gated join from meetings.
    onlineUrl: String(row.online_url ?? ''),
    registrationUrl: String(row.registration_url ?? ''),
    organizer: readLocalizedColumn(row.organizer_i18n, row.organizer, row.organizer),
    coverImageUrl: String(row.cover_url ?? ''),
    visibility: String(row.visibility ?? 'public') === 'restricted' ? 'restricted' : 'public',
    accessMinRole: String(row.access_min_role ?? ''),
    participationMode: String(row.participation_mode ?? 'offline'),
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : new Date().toISOString(),
  }
}

function mapDocumentPublic(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: readLocalizedColumn(row.title_i18n, row.title_uk, row.title_en),
    description: readLocalizedColumn(row.description_i18n, row.description_uk, row.description_en),
    type: String(row.doc_type ?? 'pdf'),
    size: String(row.size_label ?? ''),
    language: String(row.language ?? 'UA'),
    dateUpdated: row.date_updated ? String(row.date_updated).slice(0, 10) : '',
    accessLevel: String(row.access_level ?? 'public'),
    fileUrl: String(row.file_url || row.external_url || ''),
  }
}

export async function listContentMembersAdmin() {
  const sql = getSql()
  const rows = await sql`SELECT * FROM content_members ORDER BY sort_order ASC, updated_at DESC`
  return rows.map((row) => ({
    ...mapMemberPublic(row as Record<string, unknown>),
    published: String((row as Record<string, unknown>).status) === 'published',
    status: String((row as Record<string, unknown>).status || 'draft'),
  }))
}

export async function listContentNewsAdmin() {
  const sql = getSql()
  const rows = await sql`SELECT * FROM content_news ORDER BY published_at DESC NULLS LAST`
  return rows.map((row) => ({
    ...mapNewsPublic(row as Record<string, unknown>),
    published: String((row as Record<string, unknown>).status) === 'published',
    status: String((row as Record<string, unknown>).status || 'draft'),
  }))
}

export async function listContentEventsAdmin() {
  const sql = getSql()
  const rows = await sql`SELECT * FROM content_events ORDER BY start_at DESC`
  return rows.map((row) => ({
    ...mapEventPublic(row as Record<string, unknown>),
    id: String((row as Record<string, unknown>).id),
    slug: String((row as Record<string, unknown>).slug || ''),
    published: String((row as Record<string, unknown>).status) === 'published',
    status: String((row as Record<string, unknown>).status || 'draft'),
  }))
}

export async function listContentDocumentsAdmin() {
  const sql = getSql()
  const rows = await sql`SELECT * FROM content_documents ORDER BY updated_at DESC`
  return rows.map((row) => ({
    ...mapDocumentPublic(row as Record<string, unknown>),
    published: String((row as Record<string, unknown>).status) === 'published',
    status: String((row as Record<string, unknown>).status || 'draft'),
  }))
}

export async function getSiteSettingsAdmin() {
  return getPublishedSiteSettings()
}

export async function upsertContentMember(body: unknown) {
  const source = isRecord(body) ? body : {}
  const sql = getSql()
  const id = readStringOr(source.id, '')
  const name = localizedWrite(source.name, 'name', 200, {required: true})
  const shortName = localizedWrite(source.shortName, 'shortName', 120)
  const category = localizedWrite(source.category, 'category', 120)
  const shortDescription = localizedWrite(source.shortDescription, 'shortDescription', 2000)
  const fullDescription = localizedWrite(source.fullDescription, 'fullDescription', 20000)

  const slug = requireNonEmptyText(source.slug, 'slug', 80)
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const profileLevel = readStringOr(source.profileLevel, 'basic') === 'extended' ? 'extended' : 'basic'
  const sortOrder = Number.isFinite(Number(source.order)) ? Math.max(0, Math.min(9999, Number(source.order))) : 0

  const websiteUrl = normalizeOptionalHttpUrl(source.websiteUrl, 'websiteUrl')
  const logoUrl = normalizeOptionalMediaUrl(source.logoUrl, 'logoUrl')
  const coverImageUrl = normalizeOptionalMediaUrl(source.coverImageUrl, 'coverImageUrl')
  const publicEmail = normalizeOptionalPublicEmail(source.publicEmail)
  const publicPhone = normalizeOptionalPublicPhone(source.publicPhone)

  const region = clampOptionalText(source.region, 120)
  const featured = Boolean(source.featured)

  if (id) {
    const previous = await sql`
      SELECT logo_url, cover_url FROM content_members WHERE id = ${id}::uuid LIMIT 1
    `
    const previousLogo = String((previous[0] as {logo_url?: unknown} | undefined)?.logo_url ?? '')
    const previousCover = String((previous[0] as {cover_url?: unknown} | undefined)?.cover_url ?? '')

    const rows = await sql`
      UPDATE content_members SET
        slug = ${slug},
        status = ${status},
        sort_order = ${sortOrder},
        profile_level = ${profileLevel},
        name_i18n = COALESCE(${name.json}::jsonb, name_i18n),
        short_name_i18n = COALESCE(${shortName.json}::jsonb, short_name_i18n),
        category_i18n = COALESCE(${category.json}::jsonb, category_i18n),
        short_description_i18n = COALESCE(${shortDescription.json}::jsonb, short_description_i18n),
        full_description_i18n = COALESCE(${fullDescription.json}::jsonb, full_description_i18n),
        name_uk = COALESCE(${name.uk}::text, name_uk),
        name_en = COALESCE(${name.en}::text, name_en),
        short_name_uk = COALESCE(${shortName.uk}::text, short_name_uk),
        short_name_en = COALESCE(${shortName.en}::text, short_name_en),
        category_uk = COALESCE(${category.uk}::text, category_uk),
        category_en = COALESCE(${category.en}::text, category_en),
        short_description_uk = COALESCE(${shortDescription.uk}::text, short_description_uk),
        short_description_en = COALESCE(${shortDescription.en}::text, short_description_en),
        full_description_uk = COALESCE(${fullDescription.uk}::text, full_description_uk),
        full_description_en = COALESCE(${fullDescription.en}::text, full_description_en),
        logo_url = ${logoUrl},
        cover_url = ${coverImageUrl},
        website_url = ${websiteUrl},
        public_email = ${publicEmail},
        public_phone = ${publicPhone},
        region = ${region},
        featured = ${featured},
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *
    `
    if (!rows[0]) throw new Error('Member not found')
    if (previousLogo && previousLogo !== logoUrl) await releaseOwnedMediaIfUnused(previousLogo)
    if (previousCover && previousCover !== coverImageUrl) await releaseOwnedMediaIfUnused(previousCover)
    return rows[0]
  }

  const emptyJson = '[]'
  const rows = await sql`
    INSERT INTO content_members (
      slug, status, sort_order, profile_level,
      name_i18n, short_name_i18n, category_i18n, short_description_i18n, full_description_i18n,
      name_uk, name_en, short_name_uk, short_name_en, category_uk, category_en,
      short_description_uk, short_description_en, full_description_uk, full_description_en,
      logo_url, cover_url, website_url, public_email, public_phone,
      participant_types, sectors, product_categories, competencies, region, featured,
      services, certificates, cases, products
    ) VALUES (
      ${slug}, ${status}, ${sortOrder}, ${profileLevel},
      ${name.json ?? '{}'}::jsonb,
      ${shortName.json ?? '{}'}::jsonb,
      ${category.json ?? '{}'}::jsonb,
      ${shortDescription.json ?? '{}'}::jsonb,
      ${fullDescription.json ?? '{}'}::jsonb,
      ${name.uk ?? ''}, ${name.en ?? ''},
      ${shortName.uk ?? ''}, ${shortName.en ?? ''},
      ${category.uk ?? ''}, ${category.en ?? ''},
      ${shortDescription.uk ?? ''}, ${shortDescription.en ?? ''},
      ${fullDescription.uk ?? ''}, ${fullDescription.en ?? ''},
      ${logoUrl}, ${coverImageUrl},
      ${websiteUrl}, ${publicEmail},
      ${publicPhone},
      ${[]}, ${[]}, ${[]}, ${[]},
      ${region}, ${featured},
      ${emptyJson}::jsonb, ${emptyJson}::jsonb, ${emptyJson}::jsonb, ${emptyJson}::jsonb
    )
    RETURNING *
  `
  return rows[0]
}

export async function deleteContentMember(id: string) {
  const sql = getSql()
  const existing = await sql`
    SELECT logo_url, cover_url FROM content_members WHERE id = ${id}::uuid LIMIT 1
  `
  const logoUrl = String((existing[0] as {logo_url?: unknown} | undefined)?.logo_url ?? '')
  const coverUrl = String((existing[0] as {cover_url?: unknown} | undefined)?.cover_url ?? '')
  await sql`DELETE FROM content_members WHERE id = ${id}::uuid`
  if (logoUrl) await releaseOwnedMediaIfUnused(logoUrl)
  if (coverUrl) await releaseOwnedMediaIfUnused(coverUrl)
}

export async function upsertContentNews(body: unknown) {
  const source = isRecord(body) ? body : {}
  const sql = getSql()
  const id = readStringOr(source.id, '')
  const slug = readStringOr(source.slug, '')
  if (!slug) throw new Error('slug required')
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const title = localizedWrite(source.title, 'title', 300)
  const excerpt = localizedWrite(source.excerpt, 'excerpt', 2000)
  const bodyLoc = localizedWrite(source.body, 'body', 40000)
  const publishedAt = readStringOr(source.publishedAt, '') || null

  const externalUrlRaw = readStringOr(source.externalUrl, '').trim()
  let externalUrl = ''
  if (externalUrlRaw) {
    try {
      const parsed = new URL(externalUrlRaw)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('externalUrl must be http(s)')
      }
      externalUrl = parsed.toString()
    } catch (err) {
      if (err instanceof Error && err.message === 'externalUrl must be http(s)') throw err
      throw new Error('externalUrl must be a valid http(s) URL')
    }
  }

  if (id) {
    const rows = await sql`
      UPDATE content_news SET
        slug = ${slug}, status = ${status}, published_at = ${publishedAt},
        title_i18n = COALESCE(${title.json}::jsonb, title_i18n),
        excerpt_i18n = COALESCE(${excerpt.json}::jsonb, excerpt_i18n),
        body_i18n = COALESCE(${bodyLoc.json}::jsonb, body_i18n),
        title_uk = COALESCE(${title.uk}::text, title_uk),
        title_en = COALESCE(${title.en}::text, title_en),
        excerpt_uk = COALESCE(${excerpt.uk}::text, excerpt_uk),
        excerpt_en = COALESCE(${excerpt.en}::text, excerpt_en),
        body_uk = COALESCE(${bodyLoc.uk}::text, body_uk),
        body_en = COALESCE(${bodyLoc.en}::text, body_en),
        cover_url = ${readStringOr(source.coverImageUrl, '')},
        external_url = ${externalUrl},
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *
    `
    return rows[0]
  }
  const rows = await sql`
    INSERT INTO content_news (
      slug, status, published_at,
      title_i18n, excerpt_i18n, body_i18n,
      title_uk, title_en, excerpt_uk, excerpt_en, body_uk, body_en, cover_url, external_url
    ) VALUES (
      ${slug}, ${status}, ${publishedAt},
      ${title.json ?? '{}'}::jsonb,
      ${excerpt.json ?? '{}'}::jsonb,
      ${bodyLoc.json ?? '{}'}::jsonb,
      ${title.uk ?? ''}, ${title.en ?? ''},
      ${excerpt.uk ?? ''}, ${excerpt.en ?? ''},
      ${bodyLoc.uk ?? ''}, ${bodyLoc.en ?? ''},
      ${readStringOr(source.coverImageUrl, '')},
      ${externalUrl}
    )
    RETURNING *
  `
  return rows[0]
}

export async function deleteContentNews(id: string) {
  const sql = getSql()
  const existing = await sql`
    SELECT cover_url FROM content_news WHERE id = ${id}::uuid LIMIT 1
  `
  const coverUrl = String((existing[0] as {cover_url?: unknown} | undefined)?.cover_url ?? '')
  await sql`DELETE FROM content_news WHERE id = ${id}::uuid`
  if (coverUrl) {
    await releaseOwnedMediaIfUnused(coverUrl)
  }
}

export async function upsertContentEvent(body: unknown) {
  const source = isRecord(body) ? body : {}
  const sql = getSql()
  const id = readStringOr(source.id, '')
  const slug = readStringOr(source.slug, readStringOr(source.id, ''))
  if (!slug) throw new Error('slug required')
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const title = localizedWrite(source.title, 'title', 300)
  const shortDescription = localizedWrite(source.shortDescription, 'shortDescription', 2000)
  const fullDescription = localizedWrite(source.fullDescription, 'fullDescription', 20000)
  const location = localizedWrite(source.location, 'location', 300)
  const organizer = localizedWrite(source.organizer, 'organizer', 200)
  const startAt = readStringOr(source.startAt, '')
  if (!startAt) throw new Error('startAt required')
  const nextCoverUrl = readStringOr(source.coverImageUrl, '')
  const visibility =
    readStringOr(source.visibility, 'public') === 'restricted' ? 'restricted' : 'public'
  const accessMinRoleRaw = readStringOr(source.accessMinRole, '')
  const accessMinRole = accessMinRoleRaw.trim().toLowerCase()
  const allowedMin = new Set(['', 'partner', 'member', 'staff', 'board'])
  if (!allowedMin.has(accessMinRole)) {
    throw new Error('Invalid accessMinRole')
  }
  const participationMode = normalizeParticipationMode(source.participationMode)

  if (id) {
    const previous = await sql`
      SELECT cover_url FROM content_events WHERE id = ${id}::uuid LIMIT 1
    `
    const previousCoverUrl = String(
      (previous[0] as {cover_url?: unknown} | undefined)?.cover_url ?? '',
    )
    const rows = await sql`
      UPDATE content_events SET
        slug = ${slug}, status = ${status},
        title_i18n = COALESCE(${title.json}::jsonb, title_i18n),
        short_description_i18n = COALESCE(${shortDescription.json}::jsonb, short_description_i18n),
        full_description_i18n = COALESCE(${fullDescription.json}::jsonb, full_description_i18n),
        location_i18n = COALESCE(${location.json}::jsonb, location_i18n),
        organizer_i18n = COALESCE(${organizer.json}::jsonb, organizer_i18n),
        title_uk = COALESCE(${title.uk}::text, title_uk),
        title_en = COALESCE(${title.en}::text, title_en),
        short_description_uk = COALESCE(${shortDescription.uk}::text, short_description_uk),
        short_description_en = COALESCE(${shortDescription.en}::text, short_description_en),
        full_description_uk = COALESCE(${fullDescription.uk}::text, full_description_uk),
        full_description_en = COALESCE(${fullDescription.en}::text, full_description_en),
        event_type = ${readStringOr(source.type, 'meeting')},
        event_format = ${readStringOr(source.format, 'online')},
        start_at = ${startAt},
        end_at = ${readStringOr(source.endAt, '') || null},
        time_zone = ${readStringOr(source.timeZone, 'Europe/Kyiv')},
        location = COALESCE(${location.uk}::text, location),
        online_url = ${readStringOr(source.onlineUrl, '')},
        registration_url = ${readStringOr(source.registrationUrl, '')},
        organizer = COALESCE(${organizer.uk}::text, organizer),
        cover_url = ${nextCoverUrl},
        visibility = ${visibility},
        access_min_role = ${accessMinRole},
        participation_mode = ${participationMode},
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *
    `
    if (previousCoverUrl && previousCoverUrl !== nextCoverUrl) {
      await releaseOwnedMediaIfUnused(previousCoverUrl)
    }
    return rows[0]
  }
  const rows = await sql`
    INSERT INTO content_events (
      slug, status,
      title_i18n, short_description_i18n, full_description_i18n, location_i18n, organizer_i18n,
      title_uk, title_en, short_description_uk, short_description_en,
      full_description_uk, full_description_en, event_type, event_format, start_at, end_at,
      time_zone, location, online_url, registration_url, organizer, cover_url,
      visibility, access_min_role, participation_mode
    ) VALUES (
      ${slug}, ${status},
      ${title.json ?? '{}'}::jsonb,
      ${shortDescription.json ?? '{}'}::jsonb,
      ${fullDescription.json ?? '{}'}::jsonb,
      ${location.json ?? '{}'}::jsonb,
      ${organizer.json ?? '{}'}::jsonb,
      ${title.uk ?? ''}, ${title.en ?? ''},
      ${shortDescription.uk ?? ''}, ${shortDescription.en ?? ''},
      ${fullDescription.uk ?? ''}, ${fullDescription.en ?? ''},
      ${readStringOr(source.type, 'meeting')}, ${readStringOr(source.format, 'online')},
      ${startAt}, ${readStringOr(source.endAt, '') || null},
      ${readStringOr(source.timeZone, 'Europe/Kyiv')},
      ${location.uk ?? ''}, ${readStringOr(source.onlineUrl, '')},
      ${readStringOr(source.registrationUrl, '')}, ${organizer.uk ?? ''},
      ${nextCoverUrl},
      ${visibility},
      ${accessMinRole},
      ${participationMode}
    )
    RETURNING *
  `
  return rows[0]
}

export async function deleteContentEvent(id: string) {
  const sql = getSql()
  const existing = await sql`
    SELECT cover_url FROM content_events WHERE id = ${id}::uuid LIMIT 1
  `
  const coverUrl = String((existing[0] as {cover_url?: unknown} | undefined)?.cover_url ?? '')
  await sql`DELETE FROM content_events WHERE id = ${id}::uuid`
  if (coverUrl) {
    await releaseOwnedMediaIfUnused(coverUrl)
  }
}

export async function upsertContentDocument(body: unknown) {
  const source = isRecord(body) ? body : {}
  const sql = getSql()
  const id = readStringOr(source.id, '')
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const title = localizedWrite(source.title, 'title', 300)
  const description = localizedWrite(source.description, 'description', 2000)

  if (id) {
    const rows = await sql`
      UPDATE content_documents SET
        status = ${status},
        title_i18n = COALESCE(${title.json}::jsonb, title_i18n),
        description_i18n = COALESCE(${description.json}::jsonb, description_i18n),
        title_uk = COALESCE(${title.uk}::text, title_uk),
        title_en = COALESCE(${title.en}::text, title_en),
        description_uk = COALESCE(${description.uk}::text, description_uk),
        description_en = COALESCE(${description.en}::text, description_en),
        doc_type = ${readStringOr(source.type, 'pdf')},
        language = ${readStringOr(source.language, 'UA')},
        access_level = ${readStringOr(source.accessLevel, 'public')},
        size_label = ${readStringOr(source.size, '')},
        date_updated = ${readStringOr(source.dateUpdated, '') || null},
        external_url = ${readStringOr(source.externalUrl, '')},
        file_url = ${readStringOr(source.fileUrl, '')},
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *
    `
    return rows[0]
  }
  const rows = await sql`
    INSERT INTO content_documents (
      status, title_i18n, description_i18n,
      title_uk, title_en, description_uk, description_en, doc_type, language,
      access_level, size_label, date_updated, external_url, file_url
    ) VALUES (
      ${status},
      ${title.json ?? '{}'}::jsonb,
      ${description.json ?? '{}'}::jsonb,
      ${title.uk ?? ''}, ${title.en ?? ''},
      ${description.uk ?? ''}, ${description.en ?? ''},
      ${readStringOr(source.type, 'pdf')}, ${readStringOr(source.language, 'UA')},
      ${readStringOr(source.accessLevel, 'public')}, ${readStringOr(source.size, '')},
      ${readStringOr(source.dateUpdated, '') || null},
      ${readStringOr(source.externalUrl, '')}, ${readStringOr(source.fileUrl, '')}
    )
    RETURNING *
  `
  return rows[0]
}

export async function deleteContentDocument(id: string) {
  const sql = getSql()
  await sql`DELETE FROM content_documents WHERE id = ${id}::uuid`
}

export async function putSiteSettings(body: unknown) {
  const source = isRecord(body) ? body : {}
  // Settings has a single row and the form always submits both fields, so no partial-update dance.
  const address = normalizeLocalizedText(source.address, 'address', 300)
  const brand = normalizeLocalizedText(source.brandTagline, 'brandTagline', 300)
  const statsShowOnSite = Boolean(source.statsShowOnSite)
  const statsMembersValue = readStringOr(source.statsMembersValue, '').slice(0, 32)
  const statsProducersValue = readStringOr(source.statsProducersValue, '').slice(0, 32)
  const statsProjectsValue = readStringOr(source.statsProjectsValue, '').slice(0, 32)
  const statsYearsValue = readStringOr(source.statsYearsValue, '').slice(0, 32)
  const sql = getSql()
  await sql`
    INSERT INTO site_settings (
      id, phone, email, address_i18n, brand_tagline_i18n,
      address_uk, address_en, brand_tagline_uk, brand_tagline_en,
      stats_show_on_site, stats_members_value, stats_producers_value,
      stats_projects_value, stats_years_value, updated_at
    )
    VALUES (
      'siteSettings',
      ${readStringOr(source.phone, '')},
      ${readStringOr(source.email, '')},
      ${JSON.stringify(address)}::jsonb,
      ${JSON.stringify(brand)}::jsonb,
      ${address.uk ?? ''},
      ${address.en ?? ''},
      ${brand.uk ?? ''},
      ${brand.en ?? ''},
      ${statsShowOnSite},
      ${statsMembersValue},
      ${statsProducersValue},
      ${statsProjectsValue},
      ${statsYearsValue},
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address_i18n = EXCLUDED.address_i18n,
      brand_tagline_i18n = EXCLUDED.brand_tagline_i18n,
      address_uk = EXCLUDED.address_uk,
      address_en = EXCLUDED.address_en,
      brand_tagline_uk = EXCLUDED.brand_tagline_uk,
      brand_tagline_en = EXCLUDED.brand_tagline_en,
      stats_show_on_site = EXCLUDED.stats_show_on_site,
      stats_members_value = EXCLUDED.stats_members_value,
      stats_producers_value = EXCLUDED.stats_producers_value,
      stats_projects_value = EXCLUDED.stats_projects_value,
      stats_years_value = EXCLUDED.stats_years_value,
      updated_at = now()
  `
  return getPublishedSiteSettings()
}

export async function getMediaAssetById(id: string) {
  const sql = getSql()
  const rows = await sql`SELECT * FROM media_assets WHERE id = ${id}::uuid LIMIT 1`
  if (!rows[0]) return null
  const row = rows[0] as Record<string, unknown>
  return {
    id: String(row.id),
    storageKey: String(row.storage_key),
    url: String(row.url ?? ''),
    visibility: String(row.visibility) === 'private' ? 'private' as const : 'public' as const,
    mimeType: String(row.mime_type ?? 'application/octet-stream'),
    originalName: String(row.original_name ?? 'file'),
  }
}

export async function createMediaAsset(input: {
  storageKey: string
  url: string
  visibility: 'public' | 'private'
  mimeType: string
  byteSize: number
  originalName: string
  createdBy: string
}) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO media_assets (
      storage_key, url, visibility, mime_type, byte_size, original_name, created_by
    ) VALUES (
      ${input.storageKey}, ${input.url}, ${input.visibility}, ${input.mimeType},
      ${input.byteSize}, ${input.originalName}, ${input.createdBy}
    )
    RETURNING *
  `
  return {
    id: String(rows[0].id),
    url: String(rows[0].url),
    visibility: String(rows[0].visibility),
    storageKey: String(rows[0].storage_key),
  }
}
