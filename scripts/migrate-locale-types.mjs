import fs from 'node:fs'
import path from 'node:path'

const root = 'e:/Programming/Sites/UAOS/src'
const files = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(p)
  }
}

walk(root)

const skip = new Set(
  [
    'data/locales.ts',
    'App.tsx',
    'components/Header.tsx',
    'components/Footer.tsx',
    'components/CookieBanner.tsx',
    'components/LanguageSwitcher.tsx',
    'data/translations.ts',
    'data/translations/industrial.ts',
  ].map((p) => path.normalize(path.join(root, p))),
)

let changed = 0
for (const file of files) {
  if (skip.has(path.normalize(file))) continue
  let text = fs.readFileSync(file, 'utf8')
  const original = text
  if (!text.includes("'uk' | 'en'")) continue

  text = text.replace(/currentLang:\s*'uk' \| 'en'/g, 'currentLang: Locale')
  text = text.replace(/lang:\s*'uk' \| 'en'/g, 'lang: Locale')

  const posix = file.replace(/\\/g, '/')
  const already =
    text.includes("from '../data/locales'") ||
    text.includes("from '../../data/locales'") ||
    text.includes("from './locales'") ||
    text.includes("from '../locales'")

  if (!already) {
    let importLine = "import type {Locale} from '../data/locales'\n"
    if (posix.includes('/components/events/') || posix.includes('/components/member-profile/')) {
      importLine = "import type {Locale} from '../../data/locales'\n"
    } else if (posix.includes('/data/')) {
      importLine = "import type {Locale} from '../locales'\n"
    }
    text = importLine + text
  }

  if (text !== original) {
    fs.writeFileSync(file, text)
    changed += 1
    console.log('updated', path.relative(root, file))
  }
}

console.log('files changed', changed)
