/**
 * Upsert INITIAL_MEMBERS from src/data/members.ts into Neon (idempotent by slug).
 * Usage: node --env-file=.env.local scripts/seed-members.mjs
 *
 * Requires DATABASE_URL. Does not print emails/phones.
 */
import {spawnSync} from 'node:child_process'
import {existsSync, unlinkSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {neon} from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const bundlePath = path.join(__dirname, '_tmp_members_bundle.mjs')

function buildBundle() {
  const result = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      'src/data/members.ts',
      '--bundle',
      '--platform=node',
      '--format=esm',
      `--outfile=${bundlePath}`,
    ],
    {cwd: root, encoding: 'utf8'},
  )
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    process.exit(1)
  }
}

/** Keep in sync with LOCALES in src/data/locales.ts. */
const LOCALES = ['uk', 'en', 'de', 'es', 'kk', 'fr']

/** Localized field for the `*_i18n` JSONB columns: only non-empty supported locales. */
function asText(value) {
  if (typeof value === 'string') return value.trim() ? {uk: value.trim()} : {}
  if (!value || typeof value !== 'object') return {}
  const result = {}
  for (const locale of LOCALES) {
    const text = typeof value[locale] === 'string' ? value[locale].trim() : ''
    if (text) result[locale] = text
  }
  return result
}

function asStringArray(value) {
  return Array.isArray(value) ? value.map(String) : []
}

function asLocalizedArray(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => asText(item))
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  buildBundle()
  const mod = await import(pathToFileURL(bundlePath).href + `?t=${Date.now()}`)
  const members = Array.isArray(mod.INITIAL_MEMBERS) ? mod.INITIAL_MEMBERS : []
  if (!members.length) {
    console.error('INITIAL_MEMBERS is empty')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  let upserted = 0

  for (const member of members) {
    const slug = String(member.slug || member.id || '').trim()
    if (!slug) continue
    const name = asText(member.name)
    const category = asText(member.category)
    const shortDescription = asText(member.shortDescription)
    const fullDescription = asText(member.fullDescription)
    const shortName = asText(member.shortName)
    const status = member.published === false ? 'draft' : 'published'
    const profileLevel = member.profileLevel === 'extended' ? 'extended' : 'basic'
    const order = Number.isFinite(Number(member.order)) ? Number(member.order) : 0
    const logoUrl = String(member.logoUrl ?? '')
    const coverUrl = String(member.coverImageUrl ?? '')
    const websiteUrl = String(member.websiteUrl ?? '')
    const publicEmail = String(member.publicEmail ?? '')
    const publicPhone = String(member.publicPhone ?? '')
    const region = String(member.region ?? '')
    const featured = Boolean(member.featured)
    const participantTypes = asStringArray(member.participantTypes)
    const sectors = asStringArray(member.sectors)
    const productCategories = asStringArray(member.productCategories)
    const competenciesLocalized = asLocalizedArray(member.competencies)
    const competencies = competenciesLocalized.map((item) => item.uk || item.en || '')
    const competenciesJson = JSON.stringify(competenciesLocalized)
    const services = JSON.stringify(asLocalizedArray(member.services))
    const certificates = JSON.stringify(Array.isArray(member.certificates) ? member.certificates : [])
    const cases = JSON.stringify(Array.isArray(member.cases) ? member.cases : [])
    const products = JSON.stringify(Array.isArray(member.products) ? member.products : [])

    await sql`
      INSERT INTO content_members (
        slug, status, sort_order, profile_level,
        name_i18n, short_name_i18n, category_i18n, short_description_i18n, full_description_i18n,
        competencies_i18n,
        name_uk, name_en, short_name_uk, short_name_en, category_uk, category_en,
        short_description_uk, short_description_en, full_description_uk, full_description_en,
        logo_url, cover_url, website_url, public_email, public_phone,
        participant_types, sectors, product_categories, competencies, region, featured,
        services, certificates, cases, products
      ) VALUES (
        ${slug}, ${status}, ${order}, ${profileLevel},
        ${JSON.stringify(name)}::jsonb, ${JSON.stringify(shortName)}::jsonb,
        ${JSON.stringify(category)}::jsonb, ${JSON.stringify(shortDescription)}::jsonb,
        ${JSON.stringify(fullDescription)}::jsonb, ${competenciesJson}::jsonb,
        ${name.uk ?? ''}, ${name.en ?? ''}, ${shortName.uk ?? ''}, ${shortName.en ?? shortName.uk ?? ''},
        ${category.uk ?? ''}, ${category.en ?? ''},
        ${shortDescription.uk ?? ''}, ${shortDescription.en ?? ''},
        ${fullDescription.uk ?? ''}, ${fullDescription.en ?? ''},
        ${logoUrl}, ${coverUrl}, ${websiteUrl}, ${publicEmail}, ${publicPhone},
        ${participantTypes}, ${sectors}, ${productCategories}, ${competencies}, ${region}, ${featured},
        ${services}::jsonb, ${certificates}::jsonb, ${cases}::jsonb, ${products}::jsonb
      )
      ON CONFLICT (slug) DO UPDATE SET
        status = EXCLUDED.status,
        sort_order = EXCLUDED.sort_order,
        profile_level = EXCLUDED.profile_level,
        name_i18n = EXCLUDED.name_i18n,
        short_name_i18n = EXCLUDED.short_name_i18n,
        category_i18n = EXCLUDED.category_i18n,
        short_description_i18n = EXCLUDED.short_description_i18n,
        full_description_i18n = EXCLUDED.full_description_i18n,
        competencies_i18n = EXCLUDED.competencies_i18n,
        name_uk = EXCLUDED.name_uk,
        name_en = EXCLUDED.name_en,
        short_name_uk = EXCLUDED.short_name_uk,
        short_name_en = EXCLUDED.short_name_en,
        category_uk = EXCLUDED.category_uk,
        category_en = EXCLUDED.category_en,
        short_description_uk = EXCLUDED.short_description_uk,
        short_description_en = EXCLUDED.short_description_en,
        full_description_uk = EXCLUDED.full_description_uk,
        full_description_en = EXCLUDED.full_description_en,
        logo_url = EXCLUDED.logo_url,
        cover_url = EXCLUDED.cover_url,
        website_url = EXCLUDED.website_url,
        public_email = EXCLUDED.public_email,
        public_phone = EXCLUDED.public_phone,
        participant_types = EXCLUDED.participant_types,
        sectors = EXCLUDED.sectors,
        product_categories = EXCLUDED.product_categories,
        competencies = EXCLUDED.competencies,
        region = EXCLUDED.region,
        featured = EXCLUDED.featured,
        services = EXCLUDED.services,
        certificates = EXCLUDED.certificates,
        cases = EXCLUDED.cases,
        products = EXCLUDED.products,
        updated_at = now()
    `
    upserted += 1
    console.log(`upserted slug=${slug}`)
  }

  const counts = await sql`SELECT count(*)::int AS n FROM content_members WHERE status = 'published'`
  console.log(`done: upserted=${upserted}, published_members=${counts[0]?.n ?? 0}`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
  .finally(() => {
    if (existsSync(bundlePath)) {
      try {
        unlinkSync(bundlePath)
      } catch {
        // ignore cleanup errors
      }
    }
  })
