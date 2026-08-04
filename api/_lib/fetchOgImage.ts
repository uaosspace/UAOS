import dns from 'node:dns/promises'
import net from 'node:net'

const FETCH_TIMEOUT_MS = 8_000
const MAX_HTML_BYTES = 1_500_000
const MAX_REDIRECTS = 3

function isPrivateIp(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    const parts = ip.split('.').map(Number)
    const [a, b] = parts
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    return false
  }
  if (net.isIP(ip) === 6) {
    const normalized = ip.toLowerCase()
    if (normalized === '::1' || normalized === '::') return true
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // ULA
    if (normalized.startsWith('fe80')) return true // link-local
    // IPv4-mapped
    if (normalized.startsWith('::ffff:')) {
      const v4 = normalized.slice('::ffff:'.length)
      if (net.isIP(v4) === 4) return isPrivateIp(v4)
    }
    return false
  }
  return true
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const host = hostname.replace(/\.$/, '').toLowerCase()
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('URL host not allowed')
  }
  let records: Array<{address: string; family: number}>
  try {
    records = await dns.lookup(host, {all: true, verbatim: true})
  } catch {
    throw new Error('Could not resolve host')
  }
  if (!records.length) throw new Error('Could not resolve host')
  for (const record of records) {
    if (isPrivateIp(record.address)) throw new Error('URL host not allowed')
  }
}

function parseHttpUrl(raw: string, base?: string): URL {
  let url: URL
  try {
    url = base ? new URL(raw, base) : new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed')
  }
  if (url.username || url.password) throw new Error('URL credentials not allowed')
  return url
}

function extractOgImage(html: string, pageUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      try {
        return parseHttpUrl(match[1].trim(), pageUrl).toString()
      } catch {
        // try next pattern
      }
    }
  }
  return null
}

async function fetchOnce(url: URL): Promise<{status: number; location: string | null; body: string}> {
  await assertPublicHostname(url.hostname)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'UAOS-AdminCoverFetch/1.0',
      },
    })
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400) {
      return {status: response.status, location, body: ''}
    }
    if (!response.ok) throw new Error(`Page fetch failed (${response.status})`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('Page is not HTML')
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > MAX_HTML_BYTES) throw new Error('Page too large')
    return {status: response.status, location: null, body: buffer.toString('utf8')}
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Admin-only helper: read og:image / twitter:image from a public article URL.
 * Blocks private/link-local hosts (basic SSRF guard) and limits size/time.
 */
export async function fetchOgImageFromPageUrl(rawUrl: string): Promise<string> {
  let current = parseHttpUrl(rawUrl.trim())
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const result = await fetchOnce(current)
    if (result.location) {
      current = parseHttpUrl(result.location, current.toString())
      continue
    }
    const image = extractOgImage(result.body, current.toString())
    if (!image) throw new Error('No og:image found on page')
    const imageUrl = parseHttpUrl(image)
    await assertPublicHostname(imageUrl.hostname)
    return imageUrl.toString()
  }
  throw new Error('Too many redirects')
}
