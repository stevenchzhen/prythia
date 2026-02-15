import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function executeSql(sql: string, label: string): Promise<boolean> {
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
    console.error(`  ERROR [${label}]: ${text}`)
    return false
  }
  console.log(`  ✓ ${label}`)
  return true
}

async function main() {
  console.log('Running remaining migrations...\n')

  const m6 = readFileSync(join(process.cwd(), 'supabase/migrations/00006_indexes.sql'), 'utf-8')
  await executeSql(m6, '00006_indexes.sql')

  console.log('')
  const seed = readFileSync(join(process.cwd(), 'supabase/seed.sql'), 'utf-8')
  await executeSql(seed, 'seed.sql')

  console.log('\nDone!')
}

main().catch(console.error)
