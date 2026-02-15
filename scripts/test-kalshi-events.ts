/**
 * Quick test: hit the Kalshi /events endpoint and see what we get.
 */
async function main() {
  const url = 'https://api.elections.kalshi.com/trade-api/v2/events?status=open&with_nested_markets=true&limit=20'
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })

  if (!res.ok) {
    console.error(`API error: ${res.status}`)
    console.error(await res.text())
    return
  }

  const data = await res.json()
  const events = data.events || []
  console.log(`Fetched ${events.length} events\n`)

  // Count by category
  const cats: Record<string, number> = {}
  for (const e of events) {
    cats[e.category] = (cats[e.category] || 0) + 1
  }
  console.log('Categories in first page:')
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }

  // Show some non-sports events
  const nonSports = events.filter((e: { category: string }) => e.category !== 'Sports' && e.category !== 'Entertainment')
  console.log(`\nNon-sports/entertainment events: ${nonSports.length}`)
  for (const e of nonSports.slice(0, 10)) {
    const marketCount = (e.markets || []).length
    const binaryActive = (e.markets || []).filter((m: { market_type: string; status: string }) => m.market_type === 'binary' && m.status === 'active').length
    console.log(`\n  [${e.category}] ${e.title}`)
    console.log(`    event_ticker: ${e.event_ticker}, markets: ${marketCount} (${binaryActive} binary/active)`)
    if (e.markets && e.markets[0]) {
      const m = e.markets[0]
      console.log(`    sample market: "${m.title}" price=${m.last_price_dollars} vol_24h=${m.volume_24h} vol=${m.volume}`)
    }
  }
}

main().catch(console.error)
