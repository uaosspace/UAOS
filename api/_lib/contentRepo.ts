/**
 * Content repository — Neon tables for public CMS entities.
 */
import {getSql} from './db.js'
import {isRecord, readStringOr} from '../../src/lib/contentGuards.js'
import {releaseOwnedMediaIfUnused} from './mediaCleanup.js'

function asLocalized(uk: unknown, en: unknown) {
  return {uk: String(uk ?? ''), en: String(en ?? '')}
}

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

export async function listPublishedEvents() {
  const sql = getSql()
  const rows = await sql`
    SELECT * FROM content_events
    WHERE status = 'published'
    ORDER BY start_at ASC
  `
  return rows.map(mapEventPublic)
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
    }
  }
  const row = rows[0] as Record<string, unknown>
  return {
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    address: asLocalized(row.address_uk, row.address_en),
    brandTagline: asLocalized(row.brand_tagline_uk, row.brand_tagline_en),
  }
}

function mapMemberPublic(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    published: true,
    order: Number(row.sort_order ?? 0),
    profileLevel: String(row.profile_level ?? 'basic'),
    name: asLocalized(row.name_uk, row.name_en),
    shortName: String(row.short_name_uk || row.short_name_en || ''),
    category: asLocalized(row.category_uk, row.category_en),
    shortDescription: asLocalized(row.short_description_uk, row.short_description_en),
    fullDescription: asLocalized(row.full_description_uk, row.full_description_en),
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
    competencies: Array.isArray(row.competencies) ? row.competencies.map(String) : [],
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
    title: asLocalized(row.title_uk, row.title_en),
    excerpt: asLocalized(row.excerpt_uk, row.excerpt_en),
    body: asLocalized(row.body_uk, row.body_en),
    coverImageUrl: String(row.cover_url ?? ''),
    externalUrl: String(row.external_url ?? ''),
  }
}

function mapEventPublic(row: Record<string, unknown>) {
  return {
    id: String(row.slug || row.id),
    published: true,
    title: asLocalized(row.title_uk, row.title_en),
    shortDescription: asLocalized(row.short_description_uk, row.short_description_en),
    fullDescription: asLocalized(row.full_description_uk, row.full_description_en),
    type: String(row.event_type ?? 'meeting'),
    format: String(row.event_format ?? 'online'),
    startAt: new Date(String(row.start_at)).toISOString(),
    endAt: row.end_at ? new Date(String(row.end_at)).toISOString() : null,
    timeZone: String(row.time_zone ?? 'Europe/Kyiv'),
    location: String(row.location ?? ''),
    onlineUrl: String(row.online_url ?? ''),
    registrationUrl: String(row.registration_url ?? ''),
    organizer: String(row.organizer ?? ''),
    coverImageUrl: String(row.cover_url ?? ''),
  }
}

function mapDocumentPublic(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: asLocalized(row.title_uk, row.title_en),
    description: asLocalized(row.description_uk, row.description_en),
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
  const slug = readStringOr(source.slug, '')
  if (!slug) throw new Error('slug required')
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const name = isRecord(source.name) ? source.name : {}
  const shortName = isRecord(source.shortName) ? source.shortName : {}
  const category = isRecord(source.category) ? source.category : {}
  const shortDescription = isRecord(source.shortDescription) ? source.shortDescription : {}
  const fullDescription = isRecord(source.fullDescription) ? source.fullDescription : {}

  if (id) {
    const rows = await sql`
      UPDATE content_members SET
        slug = ${slug},
        status = ${status},
        sort_order = ${Number(source.order ?? 0)},
        profile_level = ${readStringOr(source.profileLevel, 'basic')},
        name_uk = ${readStringOr(name.uk, '')},
        name_en = ${readStringOr(name.en, '')},
        short_name_uk = ${readStringOr(shortName.uk, '')},
        short_name_en = ${readStringOr(shortName.en, '')},
        category_uk = ${readStringOr(category.uk, '')},
        category_en = ${readStringOr(category.en, '')},
        short_description_uk = ${readStringOr(shortDescription.uk, '')},
        short_description_en = ${readStringOr(shortDescription.en, '')},
        full_description_uk = ${readStringOr(fullDescription.uk, '')},
        full_description_en = ${readStringOr(fullDescription.en, '')},
        logo_url = ${readStringOr(source.logoUrl, '')},
        cover_url = ${readStringOr(source.coverImageUrl, '')},
        website_url = ${readStringOr(source.websiteUrl, '')},
        public_email = ${readStringOr(source.publicEmail, '')},
        public_phone = ${readStringOr(source.publicPhone, '')},
        participant_types = ${Array.isArray(source.participantTypes) ? source.participantTypes.map(String) : []},
        sectors = ${Array.isArray(source.sectors) ? source.sectors.map(String) : []},
        product_categories = ${Array.isArray(source.productCategories) ? source.productCategories.map(String) : []},
        competencies = ${Array.isArray(source.competencies) ? source.competencies.map(String) : []},
        region = ${readStringOr(source.region, '')},
        featured = ${Boolean(source.featured)},
        services = ${JSON.stringify(source.services ?? [])}::jsonb,
        certificates = ${JSON.stringify(source.certificates ?? [])}::jsonb,
        cases = ${JSON.stringify(source.cases ?? [])}::jsonb,
        products = ${JSON.stringify(source.products ?? [])}::jsonb,
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *
    `
    return rows[0]
  }

  const rows = await sql`
    INSERT INTO content_members (
      slug, status, sort_order, profile_level,
      name_uk, name_en, short_name_uk, short_name_en, category_uk, category_en,
      short_description_uk, short_description_en, full_description_uk, full_description_en,
      logo_url, cover_url, website_url, public_email, public_phone,
      participant_types, sectors, product_categories, competencies, region, featured,
      services, certificates, cases, products
    ) VALUES (
      ${slug}, ${status}, ${Number(source.order ?? 0)}, ${readStringOr(source.profileLevel, 'basic')},
      ${readStringOr(name.uk, '')}, ${readStringOr(name.en, '')},
      ${readStringOr(shortName.uk, '')}, ${readStringOr(shortName.en, '')},
      ${readStringOr(category.uk, '')}, ${readStringOr(category.en, '')},
      ${readStringOr(shortDescription.uk, '')}, ${readStringOr(shortDescription.en, '')},
      ${readStringOr(fullDescription.uk, '')}, ${readStringOr(fullDescription.en, '')},
      ${readStringOr(source.logoUrl, '')}, ${readStringOr(source.coverImageUrl, '')},
      ${readStringOr(source.websiteUrl, '')}, ${readStringOr(source.publicEmail, '')},
      ${readStringOr(source.publicPhone, '')},
      ${Array.isArray(source.participantTypes) ? source.participantTypes.map(String) : []},
      ${Array.isArray(source.sectors) ? source.sectors.map(String) : []},
      ${Array.isArray(source.productCategories) ? source.productCategories.map(String) : []},
      ${Array.isArray(source.competencies) ? source.competencies.map(String) : []},
      ${readStringOr(source.region, '')}, ${Boolean(source.featured)},
      ${JSON.stringify(source.services ?? [])}::jsonb,
      ${JSON.stringify(source.certificates ?? [])}::jsonb,
      ${JSON.stringify(source.cases ?? [])}::jsonb,
      ${JSON.stringify(source.products ?? [])}::jsonb
    )
    RETURNING *
  `
  return rows[0]
}

export async function deleteContentMember(id: string) {
  const sql = getSql()
  await sql`DELETE FROM content_members WHERE id = ${id}::uuid`
}

export async function upsertContentNews(body: unknown) {
  const source = isRecord(body) ? body : {}
  const sql = getSql()
  const id = readStringOr(source.id, '')
  const slug = readStringOr(source.slug, '')
  if (!slug) throw new Error('slug required')
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const title = isRecord(source.title) ? source.title : {}
  const excerpt = isRecord(source.excerpt) ? source.excerpt : {}
  const bodyLoc = isRecord(source.body) ? source.body : {}
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
        title_uk = ${readStringOr(title.uk, '')}, title_en = ${readStringOr(title.en, '')},
        excerpt_uk = ${readStringOr(excerpt.uk, '')}, excerpt_en = ${readStringOr(excerpt.en, '')},
        body_uk = ${readStringOr(bodyLoc.uk, '')}, body_en = ${readStringOr(bodyLoc.en, '')},
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
      slug, status, published_at, title_uk, title_en, excerpt_uk, excerpt_en, body_uk, body_en, cover_url, external_url
    ) VALUES (
      ${slug}, ${status}, ${publishedAt},
      ${readStringOr(title.uk, '')}, ${readStringOr(title.en, '')},
      ${readStringOr(excerpt.uk, '')}, ${readStringOr(excerpt.en, '')},
      ${readStringOr(bodyLoc.uk, '')}, ${readStringOr(bodyLoc.en, '')},
      ${readStringOr(source.coverImageUrl, '')},
      ${externalUrl}
    )
    RETURNING *
  `
  return rows[0]
}

export async function deleteContentNews(id: string) {
  const sql = getSql()
  await sql`DELETE FROM content_news WHERE id = ${id}::uuid`
}

export async function upsertContentEvent(body: unknown) {
  const source = isRecord(body) ? body : {}
  const sql = getSql()
  const id = readStringOr(source.id, '')
  const slug = readStringOr(source.slug, readStringOr(source.id, ''))
  if (!slug) throw new Error('slug required')
  const status = readStringOr(source.status, 'draft') === 'published' ? 'published' : 'draft'
  const title = isRecord(source.title) ? source.title : {}
  const shortDescription = isRecord(source.shortDescription) ? source.shortDescription : {}
  const fullDescription = isRecord(source.fullDescription) ? source.fullDescription : {}
  const startAt = readStringOr(source.startAt, '')
  if (!startAt) throw new Error('startAt required')
  const nextCoverUrl = readStringOr(source.coverImageUrl, '')

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
        title_uk = ${readStringOr(title.uk, '')}, title_en = ${readStringOr(title.en, '')},
        short_description_uk = ${readStringOr(shortDescription.uk, '')},
        short_description_en = ${readStringOr(shortDescription.en, '')},
        full_description_uk = ${readStringOr(fullDescription.uk, '')},
        full_description_en = ${readStringOr(fullDescription.en, '')},
        event_type = ${readStringOr(source.type, 'meeting')},
        event_format = ${readStringOr(source.format, 'online')},
        start_at = ${startAt},
        end_at = ${readStringOr(source.endAt, '') || null},
        time_zone = ${readStringOr(source.timeZone, 'Europe/Kyiv')},
        location = ${readStringOr(source.location, '')},
        online_url = ${readStringOr(source.onlineUrl, '')},
        registration_url = ${readStringOr(source.registrationUrl, '')},
        organizer = ${readStringOr(source.organizer, '')},
        cover_url = ${nextCoverUrl},
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
      slug, status, title_uk, title_en, short_description_uk, short_description_en,
      full_description_uk, full_description_en, event_type, event_format, start_at, end_at,
      time_zone, location, online_url, registration_url, organizer, cover_url
    ) VALUES (
      ${slug}, ${status},
      ${readStringOr(title.uk, '')}, ${readStringOr(title.en, '')},
      ${readStringOr(shortDescription.uk, '')}, ${readStringOr(shortDescription.en, '')},
      ${readStringOr(fullDescription.uk, '')}, ${readStringOr(fullDescription.en, '')},
      ${readStringOr(source.type, 'meeting')}, ${readStringOr(source.format, 'online')},
      ${startAt}, ${readStringOr(source.endAt, '') || null},
      ${readStringOr(source.timeZone, 'Europe/Kyiv')},
      ${readStringOr(source.location, '')}, ${readStringOr(source.onlineUrl, '')},
      ${readStringOr(source.registrationUrl, '')}, ${readStringOr(source.organizer, '')},
      ${nextCoverUrl}
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
  const title = isRecord(source.title) ? source.title : {}
  const description = isRecord(source.description) ? source.description : {}

  if (id) {
    const rows = await sql`
      UPDATE content_documents SET
        status = ${status},
        title_uk = ${readStringOr(title.uk, '')}, title_en = ${readStringOr(title.en, '')},
        description_uk = ${readStringOr(description.uk, '')},
        description_en = ${readStringOr(description.en, '')},
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
      status, title_uk, title_en, description_uk, description_en, doc_type, language,
      access_level, size_label, date_updated, external_url, file_url
    ) VALUES (
      ${status},
      ${readStringOr(title.uk, '')}, ${readStringOr(title.en, '')},
      ${readStringOr(description.uk, '')}, ${readStringOr(description.en, '')},
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
  const address = isRecord(source.address) ? source.address : {}
  const brand = isRecord(source.brandTagline) ? source.brandTagline : {}
  const sql = getSql()
  await sql`
    INSERT INTO site_settings (id, phone, email, address_uk, address_en, brand_tagline_uk, brand_tagline_en, updated_at)
    VALUES (
      'siteSettings',
      ${readStringOr(source.phone, '')},
      ${readStringOr(source.email, '')},
      ${readStringOr(address.uk, '')},
      ${readStringOr(address.en, '')},
      ${readStringOr(brand.uk, '')},
      ${readStringOr(brand.en, '')},
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address_uk = EXCLUDED.address_uk,
      address_en = EXCLUDED.address_en,
      brand_tagline_uk = EXCLUDED.brand_tagline_uk,
      brand_tagline_en = EXCLUDED.brand_tagline_en,
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
