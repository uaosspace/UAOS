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

  // Keep in sync with DEFAULT_SITE_SETTINGS in src/data/siteSettings.ts.
  const address = {
    uk: '04119, Україна, м. Київ, вул. Юрія Іллєнка, 83д',
    en: '04119, Ukraine, Kyiv, Yuria Illienka street, 83d',
    de: '04119, Ukraine, Kyjiw, Jurij-Illjenko-Straße 83d',
    es: '04119, Ucrania, Kyiv, calle Yuriya Illienka, 83d',
    kk: '04119, Украина, Киев қ., Юрий Илленко көшесі, 83д',
    fr: '04119, Ukraine, Kyiv, rue Yuriya Illienka, 83d',
  }
  const brandTagline = {
    uk: 'Українська Асоціація Професійної Безпеки',
    en: 'Ukrainian Association of Occupational Safety',
    de: 'Ukrainischer Verband für Arbeitssicherheit',
    es: 'Asociación Ucraniana de Seguridad Laboral',
    kk: 'Украина Кәсіптік Қауіпсіздік Қауымдастығы',
    fr: 'Association ukrainienne de la sécurité au travail',
  }

  await sql`
    INSERT INTO site_settings (
      id, phone, email,
      address_uk, address_en, address_i18n,
      brand_tagline_uk, brand_tagline_en, brand_tagline_i18n
    )
    VALUES (
      'siteSettings',
      '+38 067 585 9110',
      'uaos24h@gmail.com',
      ${address.uk},
      ${address.en},
      ${JSON.stringify(address)}::jsonb,
      ${brandTagline.uk},
      ${brandTagline.en},
      ${JSON.stringify(brandTagline)}::jsonb
    )
    ON CONFLICT (id) DO NOTHING
  `

  console.log('Seeded site_settings (minimal). Import full member/news/event content via /admin or extend this script.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
