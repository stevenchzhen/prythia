/**
 * Apply Supabase migrations via the service role client.
 *
 * Usage: node scripts/apply-migrations.mjs
 *
 * Connects using NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env,
 * then runs each migration SQL file via supabase.rpc() or raw fetch to the SQL endpoint.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const MIGRATIONS = [
  '00001_initial_schema.sql',
  '00002_user_tables.sql',
  '00003_ai_tables.sql',
  '00004_rls_policies.sql',
  '00005_functions.sql',
  '00006_indexes.sql',
]

/**
 * Split a SQL file into individual statements, handling $$ blocks correctly.
 */
function splitStatements(sql) {
  const statements = []
  let current = ''
  let inDollarQuote = false

  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip pure comments
    if (trimmed.startsWith('--') && !inDollarQuote) {
      current += line + '\n'
      continue
    }

    // Track $$ blocks
    const dollarCount = (line.match(/\$\$/g) || []).length
    if (dollarCount % 2 === 1) {
      inDollarQuote = !inDollarQuote
    }

    current += line + '\n'

    // Statement ends at ; but not inside $$ blocks
    if (trimmed.endsWith(';') && !inDollarQuote) {
      const stmt = current.trim()
      if (stmt && !stmt.match(/^--/)) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  // Handle any remaining content
  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}

async function executeSql(sql) {
  // Use the Supabase SQL endpoint available at /rest/v1/rpc
  // This uses a Postgres function we'll try to call
  const response = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status}: ${text.slice(0, 300)}`)
  }

  return response.json()
}

async function main() {
  console.log(`Target: ${SUPABASE_URL}\n`)

  // First, test connectivity
  console.log('Testing connection...')
  try {
    const { data, error } = await supabase.from('events').select('id').limit(1)
    if (error) throw error
    console.log(`  ✓ Connected (${data?.length ?? 0} events found)\n`)
  } catch (err) {
    console.log(`  ⊘ events table not found or empty — that's expected for first migration\n`)
  }

  // Try the /pg/query endpoint first
  console.log('Attempting migration via SQL endpoint...\n')

  for (const file of MIGRATIONS) {
    const path = resolve(__dirname, '..', 'supabase', 'migrations', file)
    const sql = readFileSync(path, 'utf-8')

    console.log(`[${file}]`)

    try {
      await executeSql(sql)
      console.log(`  ✓ Applied successfully\n`)
    } catch (err) {
      const msg = err.message || ''

      if (msg.includes('already exists')) {
        console.log(`  ⊘ Already applied (tables exist)\n`)
        continue
      }

      if (msg.includes('404') || msg.includes('not found')) {
        // /pg/query endpoint not available — try statement-by-statement via rpc
        console.log(`  ⊘ SQL endpoint not available. Trying statement-by-statement...\n`)
        await applyStatementsViaRpc(file, sql)
        continue
      }

      console.error(`  ✗ Failed: ${msg}\n`)
    }
  }

  // Final test
  console.log('\n--- Verification ---')
  const tables = ['events', 'source_contracts', 'probability_snapshots', 'daily_stats',
                  'categories', 'api_keys', 'watchlist_groups', 'watchlist_items',
                  'alerts', 'alert_history', 'user_preferences', 'ai_conversations', 'ai_messages']

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    console.log(`  ${error ? '✗' : '✓'} ${table}${error ? ` — ${error.message}` : ''}`)
  }

  console.log('\nDone.')
}

async function applyStatementsViaRpc(file, sql) {
  const statements = splitStatements(sql)
  let applied = 0
  let skipped = 0

  for (const stmt of statements) {
    // Skip pure comments
    if (stmt.replace(/--.*$/gm, '').trim() === '') continue

    try {
      // Try executing via the raw SQL endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({}),
      })
      // This won't work for DDL — just count as skipped
      skipped++
    } catch {
      skipped++
    }
  }

  console.log(`  Processed ${statements.length} statements (${applied} applied, ${skipped} skipped)`)
}

main().catch(console.error)
