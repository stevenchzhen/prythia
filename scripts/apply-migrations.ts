/**
 * Apply Supabase migrations via the Management API.
 *
 * Usage: npx tsx scripts/apply-migrations.ts
 *
 * This script reads each migration file and executes it against
 * your Supabase database using the service role key and the
 * PostgREST SQL execution workaround.
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const _supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' },
})

const MIGRATION_FILES = [
  '00001_initial_schema.sql',
  '00002_user_tables.sql',
  '00003_ai_tables.sql',
  '00004_rls_policies.sql',
  '00005_functions.sql',
  '00006_indexes.sql',
]

const SEED_FILE = 'seed.sql'

async function executeSql(sql: string, label: string): Promise<boolean> {
  // Use the Supabase rpc to execute raw SQL via a helper function
  // We need to create the function first, then call it
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    const text = await response.text()
    // If the function doesn't exist yet, we need to create it first
    if (text.includes('exec_sql') || text.includes('Could not find')) {
      return false // Signal that we need to bootstrap
    }
    console.error(`  ERROR [${label}]: ${text}`)
    return false
  }

  console.log(`  ✓ ${label}`)
  return true
}

async function bootstrap() {
  // Create the exec_sql helper function using the raw SQL endpoint
  console.log('Bootstrapping exec_sql function...')

  const bootstrapSql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `

  // Try direct database connection via PostgREST
  // First attempt: use the query parameter approach
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'SELECT 1' }),
  })

  if (!response.ok) {
    console.log('')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('  The exec_sql function does not exist yet.')
    console.log('  Please run this SQL in your Supabase Dashboard → SQL Editor:')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('')
    console.log(bootstrapSql)
    console.log('')
    console.log('  Then re-run this script: npx tsx scripts/apply-migrations.ts')
    console.log('═══════════════════════════════════════════════════════════════')
    return false
  }

  return true
}

async function main() {
  console.log('Applying Supabase migrations...')
  console.log(`Database: ${SUPABASE_URL}`)
  console.log('')

  // Check if exec_sql function exists
  const ready = await bootstrap()
  if (!ready) return

  // Apply each migration
  for (const file of MIGRATION_FILES) {
    const path = join(process.cwd(), 'supabase', 'migrations', file)
    const sql = readFileSync(path, 'utf-8')
    const success = await executeSql(sql, file)
    if (!success) {
      console.error(`Failed at ${file}. Fix the error and re-run.`)
      process.exit(1)
    }
  }

  // Apply seed data
  console.log('')
  console.log('Applying seed data...')
  const seedPath = join(process.cwd(), 'supabase', SEED_FILE)
  const seedSql = readFileSync(seedPath, 'utf-8')
  await executeSql(seedSql, SEED_FILE)

  console.log('')
  console.log('All migrations applied successfully!')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
