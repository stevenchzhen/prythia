/**
 * Backfill historical data from prediction market APIs.
 *
 * Usage: npx tsx scripts/backfill-history.ts
 *
 * Some platforms provide historical data archives.
 * This script fetches and imports historical probability data
 * to populate probability_snapshots and daily_stats tables.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backfillPolymarket() {
  // TODO: Check if Polymarket has historical CLOB data exports
  // https://github.com/topics/prediction-markets for community archives
  console.log('Backfilling Polymarket history...')
}

async function backfillKalshi() {
  // TODO: Kalshi may provide historical data on request
  console.log('Backfilling Kalshi history...')
}

async function backfillMetaculus() {
  // TODO: Metaculus has downloadable datasets
  console.log('Backfilling Metaculus history...')
}

async function main() {
  console.log('Starting historical data backfill...')
  await Promise.allSettled([
    backfillPolymarket(),
    backfillKalshi(),
    backfillMetaculus(),
  ])
  console.log('Backfill complete!')
}

main().catch(console.error)
