/**
 * One-shot generator for public/sitemap.xml (static public routes × 6 locales).
 * Origin must match src/lib/siteOrigin.ts PUBLIC_SITE_ORIGIN.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ORIGIN = 'https://uaos.space'
const LOCALES = ['uk', 'en', 'de', 'es', 'kk', 'fr']
const PATHS = [
  '/',
  '/about',
  '/members',
  '/activity',
  '/news',
  '/events',
  '/knowledge',
  '/join',
  '/contacts',
  '/privacy',
  '/terms',
]

function localized(locale, routePath) {
  if (locale === 'uk') return routePath
  return routePath === '/' ? `/${locale}` : `/${locale}${routePath}`
}

function priorityFor(routePath) {
  if (routePath === '/') return '1.0'
  if (routePath === '/privacy' || routePath === '/terms') return '0.3'
  if (routePath === '/join' || routePath === '/members') return '0.8'
  return '0.6'
}

const today = new Date().toISOString().slice(0, 10)
const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<!-- Static public routes x 6 locales. Member/news/event detail slugs are not listed yet. -->',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
]

for (const routePath of PATHS) {
  for (const locale of LOCALES) {
    const loc = `${ORIGIN}${localized(locale, routePath)}`
    lines.push('  <url>')
    lines.push(`    <loc>${loc}</loc>`)
    lines.push(`    <lastmod>${today}</lastmod>`)
    lines.push('    <changefreq>weekly</changefreq>')
    lines.push(`    <priority>${priorityFor(routePath)}</priority>`)
    lines.push('  </url>')
  }
}

lines.push('</urlset>')
lines.push('')

const root = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(root, '..', 'public', 'sitemap.xml')
fs.writeFileSync(out, lines.join('\n'), 'utf8')
console.log(`Wrote ${out} (${PATHS.length * LOCALES.length} urls)`)
