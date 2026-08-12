/**
 * Create a member portal user in Neon (admin/ops provisioning).
 * Usage:
 *   node --env-file=.env.local scripts/create-member-user.mjs --email=member@example.com --password='...' [--name='...'] [--member-id=uuid] [--level=member]
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

const ALLOWED = new Set(['partner', 'member', 'staff', 'board'])

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const email = arg('email').trim().toLowerCase()
  const password = arg('password')
  const displayName = arg('name') || ''
  const memberId = arg('member-id').trim() || null
  const fromRoles = (arg('roles') || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  let level = (arg('level') || fromRoles[0] || 'member').trim().toLowerCase()
  if (level === 'other') level = 'partner'
  if (!ALLOWED.has(level)) {
    console.error('Invalid --level (partner|member|staff|board)')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('Required: --email= --password=')
    process.exit(1)
  }
  if (password.length < 12 || /\s/.test(password)) {
    console.error('Password must be at least 12 characters without whitespace')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  if (memberId) {
    const members = await sql`SELECT id FROM content_members WHERE id = ${memberId}::uuid LIMIT 1`
    if (!members[0]) {
      console.error('content_members row not found for --member-id')
      process.exit(1)
    }
  }

  const passwordHash = hashPassword(password)
  const existing = await sql`SELECT id FROM member_users WHERE lower(email) = ${email} LIMIT 1`
  let row
  if (existing[0]) {
    const updated = await sql`
      UPDATE member_users
      SET password_hash = ${passwordHash},
          display_name = ${displayName},
          member_id = ${memberId},
          access_level = ${level},
          active = true,
          failed_login_count = 0,
          locked_until = NULL,
          updated_at = now()
      WHERE id = ${existing[0].id}::uuid
      RETURNING id, email, member_id, access_level
    `
    row = updated[0]
  } else {
    const inserted = await sql`
      INSERT INTO member_users (email, display_name, password_hash, member_id, access_level)
      VALUES (${email}, ${displayName}, ${passwordHash}, ${memberId}, ${level})
      RETURNING id, email, member_id, access_level
    `
    row = inserted[0]
  }
  console.log('member user ready:', {
    id: row.id,
    email: row.email,
    memberId: row.member_id,
    accessLevel: row.access_level,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
