import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {neon} from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(__dirname, '../db/migrations')

function splitSqlStatements(body) {
  return body
    .split(/;\s*\n/)
    .map((chunk) =>
      chunk
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim()
          return trimmed.length > 0 && !trimmed.startsWith('--')
        })
        .join('\n')
        .trim(),
    )
    .filter((chunk) => chunk.length > 0)
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  const appliedRows = await sql`SELECT id FROM schema_migrations ORDER BY id ASC`
  const applied = new Set(appliedRows.map((row) => String(row.id)))

  const files = (await readdir(migrationsDir))
    .filter((name) => /^\d+_.*\.sql$/i.test(name))
    .sort()

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`)
      continue
    }
    const fullPath = path.join(migrationsDir, file)
    const body = await readFile(fullPath, 'utf8')
    console.log(`apply ${file}`)
    const statements = splitSqlStatements(body)

    for (const statement of statements) {
      await sql.query(statement)
    }
    await sql`INSERT INTO schema_migrations (id) VALUES (${file})`
  }

  console.log('migrations complete')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
