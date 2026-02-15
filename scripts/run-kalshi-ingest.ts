import 'dotenv/config'
import { fetchKalshi } from '../src/lib/ingestion/kalshi'

async function main() {
  console.log('Running Kalshi ingestion with new /events endpoint...\n')
  const result = await fetchKalshi()
  console.log('Result:', JSON.stringify(result, null, 2))
}

main().catch(console.error)
