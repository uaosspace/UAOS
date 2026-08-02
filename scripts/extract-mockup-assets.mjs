import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const htmlPath = path.join(root, 'UAOS_Industrial_Neon_Prototype_v2.html')
const html = fs.readFileSync(htmlPath, 'utf8')

const heroMatch = html.match(/\.hero-photo\s*\{[^}]*url\("(data:image\/webp;base64,[^"]+)"\)/)
if (!heroMatch) {
  console.error('hero-photo base64 not found')
  process.exit(1)
}

const b64 = heroMatch[1].replace('data:image/webp;base64,', '')
const imagesDir = path.join(root, 'public', 'images')
fs.mkdirSync(imagesDir, {recursive: true})
const heroPath = path.join(imagesDir, 'hero-default.webp')
fs.writeFileSync(heroPath, Buffer.from(b64, 'base64'))
console.log('hero saved:', heroPath, fs.statSync(heroPath).size, 'bytes')

const styleStart = html.indexOf('<style>') + 7
const styleEnd = html.indexOf('</style>')
let css = html.slice(styleStart, styleEnd)
css = css.replace(
  /\.hero-photo\s*\{([^}]*?)url\("data:image[^"]+"\)([^}]*)\}/s,
  '.hero-photo {$1var(--hero-image-url)$2}',
)

const stylesDir = path.join(root, 'src', 'styles')
fs.mkdirSync(stylesDir, {recursive: true})
const cssPath = path.join(stylesDir, 'industrial-neon.css')
fs.writeFileSync(cssPath, css.trim())
console.log('css saved:', cssPath, css.split('\n').length, 'lines')
