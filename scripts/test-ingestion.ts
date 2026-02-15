/**
 * Test the ingestion pipeline locally.
 *
 * Usage: npx tsx scripts/test-ingestion.ts
 *
 * Fetches from each prediction market API and logs the results
 * without writing to the database.
 */

async function testPolymarket() {
  console.log('\n--- Polymarket ---')
  try {
    const res = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=5')
    const data = await res.json()
    console.log(`Fetched ${data.length} markets`)
    data.slice(0, 3).forEach((m: Record<string, unknown>) => {
      console.log(`  - ${m.question}`)
    })
  } catch (err) {
    console.error('Polymarket error:', err)
  }
}

async function testKalshi() {
  console.log('\n--- Kalshi ---')
  try {
    const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=5')
    const data = await res.json()
    const markets = data.markets || []
    console.log(`Fetched ${markets.length} markets`)
    markets.slice(0, 3).forEach((m: Record<string, unknown>) => {
      console.log(`  - ${m.title}`)
    })
  } catch (err) {
    console.error('Kalshi error:', err)
  }
}

async function testMetaculus() {
  console.log('\n--- Metaculus ---')
  try {
    const res = await fetch('https://www.metaculus.com/api2/questions/?status=open&type=binary&limit=5&order_by=-activity')
    const data = await res.json()
    const questions = data.results || []
    console.log(`Fetched ${questions.length} questions`)
    questions.slice(0, 3).forEach((q: Record<string, unknown>) => {
      console.log(`  - ${q.title}`)
    })
  } catch (err) {
    console.error('Metaculus error:', err)
  }
}

async function main() {
  console.log('Testing ingestion pipeline...')
  await testPolymarket()
  await testKalshi()
  await testMetaculus()
  console.log('\nDone!')
}

main().catch(console.error)
