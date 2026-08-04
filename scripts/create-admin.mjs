/**
 * Create an admin user in Neon.
 * Usage:
 *   node --env-file=.env.local scripts/create-admin.mjs --email=admin@example.com --password='...' --role=admin
 */
import {neon} from '@neondatabase/serverless'
import {randomBytes, scryptSync} from 'node:crypto'

function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 32, {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024})
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

function arg(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((item) => item.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : ''
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const email = arg('email').trim().toLowerCase()
  const password = arg('password')
  const role = arg('role') || 'admin'
  const displayName = arg('name') || ''
  if (!email || !password) {
    console.error('Required: --email= --password=')
    process.exit(1)
  }
  if (!['admin', 'editor', 'applications'].includes(role)) {
    console.error('role must be admin|editor|applications')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const passwordHash = hashPassword(password)
  const existing = await sql`SELECT id FROM admin_users WHERE lower(email) = ${email} LIMIT 1`
  let row
  if (existing[0]) {
    const updated = await sql`
      UPDATE admin_users
      SET password_hash = ${passwordHash},
          role = ${role},
          display_name = ${displayName},
          updated_at = now()
      WHERE id = ${existing[0].id}::uuid
      RETURNING id, email, role
    `
    row = updated[0]
  } else {
    const inserted = await sql`
      INSERT INTO admin_users (email, display_name, password_hash, role)
      VALUES (${email}, ${displayName}, ${passwordHash}, ${role})
      RETURNING id, email, role
    `
    row = inserted[0]
  }
  console.log('admin user ready:', row)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
