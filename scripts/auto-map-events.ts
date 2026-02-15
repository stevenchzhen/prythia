/**
 * Auto-map source contracts to canonical Prythia events using Claude Haiku.
 *
 * Usage: npx tsx scripts/auto-map-events.ts
 *
 * This is a manual wrapper around the auto-mapper module.
 * The same logic runs on a 30-min cron via /api/cron/auto-map.
 */

import 'dotenv/config'

async function main() {
  console.log('═══ Prythia Auto-Mapper ═══\n')

  // Dynamic import to pick up path aliases via tsx
  const { runAutoMapper } = await import('../src/lib/ingestion/auto-mapper')
  const { aggregateAllEvents } = await import('../src/lib/ingestion/aggregator')

  // No time budget when running manually
  const result = await runAutoMapper(Infinity)

  console.log(`\nContracts found: ${result.contractsFound}`)
  console.log(`Batches processed: ${result.batchesProcessed}`)
  console.log(`Events created: ${result.eventsCreated}`)
  console.log(`Mappings created: ${result.mappingsCreated}`)
  console.log(`Duration: ${(result.duration_ms / 1000).toFixed(1)}s`)

  if (result.eventsCreated > 0) {
    console.log('\nRunning aggregation for mapped events...')
    const aggResult = await aggregateAllEvents()
    console.log(`Aggregated: ${aggResult.eventsUpdated}/${aggResult.eventsProcessed} events`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
