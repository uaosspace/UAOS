/**
 * Push local secrets into Vercel Environment = Development (used by `vercel dev`).
 * SITE_URL is forced to http://localhost:3000 for CSRF on local admin.
 *
 * Usage: node --env-file=.env.local scripts/sync-vercel-development-env.mjs
 * Does not print secret values.
 */
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ENV_FILE = path.join(ROOT, '.env.local')
const TARGET = 'development'
const LOCAL_SITE_URL = 'http://localhost:3000'

/** Keys required for local admin + public API against the shared Neon/Blob. */
const REQUIRED = [
  'DATABASE_URL',
  'MFA_ENC_KEY',
  'SESSION_SECRET',
  'SITE_URL',
  'PRIVACY_POLICY_VERSION',
  'BLOB_READ_WRITE_TOKEN',
  'BLOB_STORE_ID',
  'VITE_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
]

/** Optional; sync if present in .env.local. */
const OPTIONAL = ['BLOB_WEBHOOK_PUBLIC_KEY', 'BREVO_API_KEY', 'NOTIFY_EMAIL_TO', 'NOTIFY_EMAIL_FROM']

function parseEnvFile(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${path.relative(ROOT, filePath)}`)
  }
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function upsertEnv(name, value) {
  // Windows: shell:true + --value breaks on `&` inside Neon URLs (channel_binding=…).
  // Pipe the value via a temp file so metacharacters never hit cmd.exe parsing.
  const tmp = path.join(os.tmpdir(), `uaos-vercel-env-${process.pid}-${name}.txt`)
  fs.writeFileSync(tmp, value, 'utf8')
  try {
    const quotedTmp = `"${tmp.replace(/"/g, '')}"`
    const command =
      process.platform === 'win32'
        ? `type ${quotedTmp} | npx vercel env add ${name} ${TARGET} --force --yes`
        : `npx vercel env add ${name} ${TARGET} --force --yes < ${JSON.stringify(tmp)}`
    const result = spawnSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      shell: true,
    })
    const out = `${result.stdout || ''}\n${result.stderr || ''}`
    const ok =
      result.status === 0 ||
      /\b(Overrode|Added|Saved)\b/i.test(out)
    if (!ok) {
      const spawnErr = result.error ? String(result.error.message || result.error) : ''
      const err = (result.stderr || result.stdout || spawnErr || '').trim()
      throw new Error(`Failed to set ${name} (${TARGET}): ${err || `exit ${result.status}`}`)
    }
  } finally {
    try {
      fs.unlinkSync(tmp)
    } catch {
      // ignore cleanup errors
    }
  }
}

const local = parseEnvFile(ENV_FILE)
local.SITE_URL = LOCAL_SITE_URL

const missing = REQUIRED.filter((k) => !local[k]?.trim())
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(', ')}`)
  process.exit(1)
}

const synced = []
const skippedOptional = []

for (const key of REQUIRED) {
  upsertEnv(key, local[key].trim())
  synced.push(key)
}

for (const key of OPTIONAL) {
  const value = local[key]?.trim()
  if (!value) {
    skippedOptional.push(key)
    continue
  }
  upsertEnv(key, value)
  synced.push(key)
}

console.log(`Synced to Vercel ${TARGET}: ${synced.join(', ')}`)
if (skippedOptional.length) {
  console.log(`Optional not in .env.local (skipped): ${skippedOptional.join(', ')}`)
}
console.log(`SITE_URL forced to ${LOCAL_SITE_URL}`)
console.log('Next: npx vercel dev --listen 3000')
