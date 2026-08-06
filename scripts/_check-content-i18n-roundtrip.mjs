/**
 * Smoke test for the localized-content repository against Neon: writes temporary DRAFT rows with
 * six locales, reads them back through the admin mappers, then deletes them. Draft rows are never
 * exposed by the public API. Site settings are only read, never written.
 * Usage: node --env-file=.env.local scripts/_check-content-i18n-roundtrip.mjs
 */
import {spawnSync} from 'node:child_process'
import {existsSync, unlinkSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const bundlePath = path.join(__dirname, '_tmp_content_repo_bundle.mjs')

function buildBundle() {
  const result = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      'api/_lib/contentRepo.ts',
      '--bundle',
      '--platform=node',
      '--format=esm',
      '--packages=external',
      `--outfile=${bundlePath}`,
    ],
    {cwd: root, encoding: 'utf8', shell: process.platform === 'win32'},
  )
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    process.exit(1)
  }
}

const SLUG = 'zz-i18n-roundtrip-check'
const SIX = {uk: 'Назва', en: 'Name', de: 'Name DE', es: 'Nombre', kk: 'Атауы', fr: 'Nom'}

function assert(condition, message) {
  if (!condition) throw new Error(`assert failed: ${message}`)
  console.log(`ok: ${message}`)
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  buildBundle()
  const repo = await import(pathToFileURL(bundlePath).href + `?t=${Date.now()}`)

  const created = []
  try {
    // Member: insert with all locales, then update only some fields.
    const member = await repo.upsertContentMember({
      slug: SLUG,
      status: 'draft',
      name: SIX,
      shortName: 'ZZ',
      category: {uk: 'Категорія', en: 'Category', de: 'Kategorie'},
      shortDescription: {uk: 'Коротко', en: 'Short', kk: 'Қысқаша'},
      fullDescription: {uk: 'Повний', en: 'Full', fr: 'Complet'},
    })
    created.push(['member', String(member.id)])
    assert(member.name_i18n.fr === 'Nom', 'member insert stores fr in name_i18n')
    assert(member.name_uk === 'Назва', 'member insert dual-writes legacy name_uk')

    const updated = await repo.upsertContentMember({
      id: String(member.id),
      slug: SLUG,
      status: 'draft',
      name: {...SIX, de: 'Name DE geändert'},
      shortName: 'ZZ',
    })
    assert(updated.name_i18n.de === 'Name DE geändert', 'member update rewrites name_i18n')
    assert(
      updated.full_description_i18n.fr === 'Complet',
      'member update keeps fields absent from payload',
    )
    assert(updated.category_uk === 'Категорія', 'member update keeps legacy column of absent field')

    const members = await repo.listContentMembersAdmin()
    const mapped = members.find((item) => item.slug === SLUG)
    assert(mapped.name.es === 'Nombre', 'admin listing maps es from JSONB')
    assert(mapped.shortName === 'ZZ', 'admin listing keeps shortName a string')

    // News.
    const news = await repo.upsertContentNews({
      slug: SLUG,
      status: 'draft',
      title: SIX,
      excerpt: {uk: 'Коротко', en: 'Short'},
      body: {uk: 'Тіло', de: 'Körper'},
    })
    created.push(['news', String(news.id)])
    assert(news.title_i18n.kk === 'Атауы', 'news insert stores kk in title_i18n')
    assert(news.body_i18n.en === undefined, 'news insert leaves untranslated locale absent')

    // Event with localized location/organizer.
    const event = await repo.upsertContentEvent({
      slug: SLUG,
      status: 'draft',
      title: SIX,
      startAt: '2030-01-01T10:00:00.000Z',
      location: {uk: 'Київ', en: 'Kyiv', de: 'Kiew'},
      organizer: {uk: 'УАПБ', en: 'UAOS'},
    })
    created.push(['event', String(event.id)])
    assert(event.location_i18n.de === 'Kiew', 'event insert stores localized location')
    assert(event.location === 'Київ', 'event insert dual-writes legacy location text')

    const events = await repo.listContentEventsAdmin()
    const mappedEvent = events.find((item) => item.slug === SLUG)
    assert(mappedEvent.location.de === 'Kiew', 'admin listing maps event location object')

    // Document.
    const document = await repo.upsertContentDocument({
      status: 'draft',
      title: SIX,
      description: {uk: 'Опис', fr: 'Description'},
    })
    created.push(['document', String(document.id)])
    assert(document.description_i18n.fr === 'Description', 'document insert stores fr description')

    // Settings: read only.
    const settings = await repo.getSiteSettingsAdmin()
    assert(typeof settings.address.uk === 'string', 'site settings read returns localized address')

    // Validation still rejects bad input.
    let rejected = false
    try {
      await repo.upsertContentMember({slug: SLUG, name: {en: 'only en'}})
    } catch (err) {
      rejected = /name\.uk required/.test(err.message)
    }
    assert(rejected, 'member upsert still requires name.uk')

    console.log('roundtrip: OK')
  } finally {
    for (const [kind, id] of created.reverse()) {
      if (kind === 'member') await repo.deleteContentMember(id)
      if (kind === 'news') await repo.deleteContentNews(id)
      if (kind === 'event') await repo.deleteContentEvent(id)
      if (kind === 'document') await repo.deleteContentDocument(id)
      console.log(`cleaned ${kind} ${id}`)
    }
  }
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
