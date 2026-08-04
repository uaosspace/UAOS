import {neon} from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT email, role, active, mfa_enabled FROM admin_users ORDER BY email`
console.log(JSON.stringify(rows, null, 2))
