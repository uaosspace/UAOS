/**
 * Диагностика покрытия локалей: какие ключи переводов реально существуют для каждой локали,
 * а какие подставляются английским fallback в src/data/translations.ts.
 *
 * Запуск: node scripts/_check-i18n-coverage.mjs
 */
import fs from 'node:fs'

const LOCALES = ['uk', 'en', 'de', 'es', 'kk', 'fr']

const FILES = {
  industrial: 'src/data/translations/industrial.ts',
  uiCore: 'src/data/translations/uiCore.ts',
  membership: 'src/data/translations/membership.ts',
  admin: 'src/data/translations/admin.ts',
  events: 'src/data/translations/events.ts',
  pages: 'src/data/translations/pages.ts',
}

/**
 * Словари внутренней админки переводятся только на uk/en по решению владельца продукта,
 * поэтому их ключи не входят в знаменатель покрытия публичных локалей.
 */
const BILINGUAL_FILES = new Set(['admin'])

/** Ключи одного locale-блока верхнего уровня внутри экспортируемого объекта. */
function readLocaleKeys(file, locale) {
  const src = fs.readFileSync(file, 'utf8')
  const start = new RegExp(`^  ${locale}: \\{`, 'm').exec(src)
  if (!start) return null

  const rest = src.slice(start.index + start[0].length)
  const endIndex = rest.search(/^  \},?$/m)
  const body = endIndex < 0 ? rest : rest.slice(0, endIndex)

  return new Set([...body.matchAll(/^    ([A-Za-z0-9_]+):/gm)].map((m) => m[1]))
}

const perFile = {}
for (const [name, file] of Object.entries(FILES)) {
  perFile[name] = {}
  for (const locale of LOCALES) {
    perFile[name][locale] = readLocaleKeys(file, locale)
  }
}

console.log('Ключей на локаль по файлам:')
for (const [name, byLocale] of Object.entries(perFile)) {
  const row = LOCALES.map((l) => `${l}=${byLocale[l] ? byLocale[l].size : '—'}`).join('  ')
  const tag = BILINGUAL_FILES.has(name) ? ' (только uk/en)' : ''
  console.log(`  ${name.padEnd(11)} ${row}${tag}`)
}

// EN полон по определению и служит fallback в src/data/translations.ts
const publicKeys = new Set()
let bilingualKeyCount = 0
for (const [name, byLocale] of Object.entries(perFile)) {
  if (BILINGUAL_FILES.has(name)) {
    bilingualKeyCount += (byLocale.en ?? new Set()).size
    continue
  }
  for (const key of byLocale.en ?? []) publicKeys.add(key)
}

/** Публичные ключи, реально существующие для локали (без английского fallback). */
function ownPublicKeys(locale) {
  const owned = new Set()
  for (const [name, byLocale] of Object.entries(perFile)) {
    if (BILINGUAL_FILES.has(name)) continue
    for (const key of byLocale[locale] ?? []) owned.add(key)
  }
  return owned
}

console.log('')
console.log(`Публичных ключей UI: ${publicKeys.size}`)
console.log(`admin (намеренно uk/en): ${bilingualKeyCount} ключей — вне знаменателя покрытия`)
console.log('')
console.log('Фактическое покрытие публичных ключей (остальное = английский текст):')

const gaps = []
for (const locale of LOCALES) {
  const owned = ownPublicKeys(locale)
  const missing = [...publicKeys].filter((key) => !owned.has(key))
  const covered = publicKeys.size - missing.length
  const percent = Math.round((covered / publicKeys.size) * 100)
  const tail = missing.length > 0 ? ` — английским остаётся ${missing.length}` : ''
  console.log(`  ${locale}: ${covered}/${publicKeys.size} (${percent}%)${tail}`)
  if (missing.length > 0) gaps.push({locale, missing})
}

if (gaps.length > 0) {
  console.log('')
  console.log('Непереведённые публичные ключи по файлам:')
  for (const {locale, missing} of gaps) {
    const byFile = Object.entries(perFile)
      .filter(([name]) => !BILINGUAL_FILES.has(name))
      .map(([name, byLocale]) => {
        const fileKeys = byLocale.en ?? new Set()
        const count = missing.filter((key) => fileKeys.has(key)).length
        return count > 0 ? `${name}=${count}` : null
      })
      .filter(Boolean)
    console.log(`  ${locale}: ${missing.length} (${byFile.join(', ')})`)
  }
}
