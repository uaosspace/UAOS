/**
 * Seed Neon content tables from local INITIAL_* datasets (no Sanity).
 * Usage: node --env-file=.env.local scripts/seed-db.mjs
 */
import {neon} from '@neondatabase/serverless'

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  await sql`
    INSERT INTO site_settings (id, phone, email, address_uk, address_en, brand_tagline_uk, brand_tagline_en)
    VALUES (
      'siteSettings',
      '+38 067 585 9110',
      'uaos24h@gmail.com',
      '04119, Україна, м. Київ, вул. Юрія Іллєнка, 83д',
      '04119, Ukraine, Kyiv, Yuria Illienka street, 83d',
      'Українська Асоціація Професійної Безпеки',
      'Ukrainian Association of Occupational Safety'
    )
    ON CONFLICT (id) DO NOTHING
  `

  console.log('Seeded site_settings (minimal). Import full member/news/event content via /admin or extend this script.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
