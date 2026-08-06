/**
 * Read-only integrity check for the localized-content JSONB migration (005).
 * Prints, per field: rows with non-empty legacy text vs rows with that locale key in JSONB.
 * Usage: node --env-file=.env.local scripts/_check-content-i18n.mjs
 */
import {neon} from '@neondatabase/serverless'

const FIELDS = [
  ['content_members', 'name_uk', 'name_en', 'name_i18n'],
  ['content_members', 'short_name_uk', 'short_name_en', 'short_name_i18n'],
  ['content_members', 'category_uk', 'category_en', 'category_i18n'],
  ['content_members', 'short_description_uk', 'short_description_en', 'short_description_i18n'],
  ['content_members', 'full_description_uk', 'full_description_en', 'full_description_i18n'],
  ['content_news', 'title_uk', 'title_en', 'title_i18n'],
  ['content_news', 'excerpt_uk', 'excerpt_en', 'excerpt_i18n'],
  ['content_news', 'body_uk', 'body_en', 'body_i18n'],
  ['content_events', 'title_uk', 'title_en', 'title_i18n'],
  ['content_events', 'short_description_uk', 'short_description_en', 'short_description_i18n'],
  ['content_events', 'full_description_uk', 'full_description_en', 'full_description_i18n'],
  ['content_events', 'location', 'location', 'location_i18n'],
  ['content_events', 'organizer', 'organizer', 'organizer_i18n'],
  ['content_documents', 'title_uk', 'title_en', 'title_i18n'],
  ['content_documents', 'description_uk', 'description_en', 'description_i18n'],
  ['site_settings', 'address_uk', 'address_en', 'address_i18n'],
  ['site_settings', 'brand_tagline_uk', 'brand_tagline_en', 'brand_tagline_i18n'],
]

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  const columnRows = await sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
  `
  const existing = new Set(columnRows.map((row) => `${row.table_name}.${row.column_name}`))

  for (const table of ['content_members', 'content_news', 'content_events', 'content_documents', 'site_settings']) {
    const rows = await sql.query(`SELECT count(*)::int AS n FROM ${table}`)
    console.log(`${table}: rows=${rows[0].n}`)
  }

  let mismatches = 0
  for (const [table, legacyUk, legacyEn, jsonColumn] of FIELDS) {
    const hasJson = existing.has(`${table}.${jsonColumn}`)
    const legacy = await sql.query(
      `SELECT
         count(*) FILTER (WHERE ${legacyUk} <> '')::int AS uk,
         count(*) FILTER (WHERE ${legacyEn} <> '')::int AS en
       FROM ${table}`,
    )
    if (!hasJson) {
      console.log(`${table}.${jsonColumn}: MISSING (legacy uk=${legacy[0].uk} en=${legacy[0].en})`)
      continue
    }
    const json = await sql.query(
      `SELECT
         count(*) FILTER (WHERE ${jsonColumn} ? 'uk')::int AS uk,
         count(*) FILTER (WHERE ${jsonColumn} ? 'en')::int AS en,
         count(*) FILTER (WHERE ${jsonColumn} ? 'de')::int AS de,
         count(*) FILTER (WHERE ${jsonColumn} ? 'es')::int AS es,
         count(*) FILTER (WHERE ${jsonColumn} ? 'kk')::int AS kk,
         count(*) FILTER (WHERE ${jsonColumn} ? 'fr')::int AS fr,
         count(*) FILTER (
           WHERE ${jsonColumn} ? 'uk' AND ${jsonColumn}->>'uk' <> ${legacyUk} AND ${legacyUk} <> ''
         )::int AS uk_diff
       FROM ${table}`,
    )
    const row = json[0]
    const ok = row.uk === legacy[0].uk && row.en === legacy[0].en && row.uk_diff === 0
    if (!ok) mismatches += 1
    console.log(
      `${table}.${jsonColumn}: legacy(uk=${legacy[0].uk}, en=${legacy[0].en}) ` +
        `json(uk=${row.uk}, en=${row.en}, de=${row.de}, es=${row.es}, kk=${row.kk}, fr=${row.fr}) ` +
        `uk_text_differs=${row.uk_diff} ${ok ? 'OK' : 'MISMATCH'}`,
    )
  }

  if (existing.has('content_members.competencies_i18n')) {
    const rows = await sql`
      SELECT
        count(*) FILTER (WHERE cardinality(competencies) > 0)::int AS legacy_rows,
        count(*) FILTER (WHERE jsonb_array_length(competencies_i18n) > 0)::int AS json_rows,
        COALESCE(sum(cardinality(competencies)), 0)::int AS legacy_items,
        COALESCE(sum(jsonb_array_length(competencies_i18n)), 0)::int AS json_items
      FROM content_members
    `
    const row = rows[0]
    const ok = row.legacy_items === row.json_items
    if (!ok) mismatches += 1
    console.log(
      `content_members.competencies_i18n: legacy(rows=${row.legacy_rows}, items=${row.legacy_items}) ` +
        `json(rows=${row.json_rows}, items=${row.json_items}) ${ok ? 'OK' : 'MISMATCH'}`,
    )
  }

  console.log(mismatches === 0 ? 'integrity: OK' : `integrity: ${mismatches} MISMATCH(ES)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
