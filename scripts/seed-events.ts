/**
 * Seed script: Populate the initial event taxonomy and sample events.
 *
 * Usage: npx tsx scripts/seed-events.ts
 *
 * This script:
 * 1. Seeds the categories table with the full taxonomy
 * 2. Creates the initial 200 canonical events
 * 3. Sets up event_source_mappings for known contracts
 *
 * Run this BEFORE building the UI so you have real data to develop against.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedCategories() {
  const categories = [
    { slug: 'geopolitics', name: 'Geopolitics', parent_slug: null, sort_order: 0 },
    { slug: 'trade_tariffs', name: 'Trade & Tariffs', parent_slug: 'geopolitics', sort_order: 1 },
    { slug: 'sanctions_export_controls', name: 'Sanctions & Export Controls', parent_slug: 'geopolitics', sort_order: 2 },
    { slug: 'military_conflict', name: 'Military & Conflict', parent_slug: 'geopolitics', sort_order: 3 },
    { slug: 'diplomacy_treaties', name: 'Diplomacy & Treaties', parent_slug: 'geopolitics', sort_order: 4 },
    { slug: 'elections_political', name: 'Elections & Political', parent_slug: 'geopolitics', sort_order: 5 },
    { slug: 'economics_policy', name: 'Economics & Policy', parent_slug: null, sort_order: 10 },
    { slug: 'monetary_policy', name: 'Monetary Policy', parent_slug: 'economics_policy', sort_order: 11 },
    { slug: 'fiscal_policy', name: 'Fiscal Policy', parent_slug: 'economics_policy', sort_order: 12 },
    { slug: 'regulation', name: 'Regulation', parent_slug: 'economics_policy', sort_order: 13 },
    { slug: 'economic_indicators', name: 'Economic Indicators', parent_slug: 'economics_policy', sort_order: 14 },
    { slug: 'technology_industry', name: 'Technology & Industry', parent_slug: null, sort_order: 20 },
    { slug: 'science_environment', name: 'Science & Environment', parent_slug: null, sort_order: 30 },
  ]

  const { error } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' })
  if (error) {
    console.error('Error seeding categories:', error)
  } else {
    console.log(`Seeded ${categories.length} categories`)
  }
}

async function seedSampleEvents() {
  // TODO: Populate with real events from prediction market research
  const sampleEvents = [
    {
      id: 'evt_us_china_tariff_q3_2026',
      title: 'US increases China tariff rate above 145% before October 2026',
      slug: 'us-china-tariff-increase-q3-2026',
      description: 'Will the effective US tariff rate on Chinese imports exceed 145% at any point before October 1, 2026?',
      category: 'trade_tariffs',
      subcategory: 'us_china_trade',
      tags: ['china', 'tariffs', 'trade-war', 'section-301'],
      resolution_date: '2026-10-01T00:00:00Z',
      resolution_status: 'open',
    },
    {
      id: 'evt_fed_rate_mar_2026',
      title: 'Fed cuts rates at March 2026 meeting',
      slug: 'fed-rate-cut-march-2026',
      description: 'Will the Federal Reserve cut the federal funds rate at the March 18-19, 2026 FOMC meeting?',
      category: 'monetary_policy',
      subcategory: 'fed_decisions',
      tags: ['fed', 'interest-rates', 'fomc', 'monetary-policy'],
      resolution_date: '2026-03-19T00:00:00Z',
      resolution_status: 'open',
    },
  ]

  const { error } = await supabase.from('events').upsert(sampleEvents, { onConflict: 'id' })
  if (error) {
    console.error('Error seeding events:', error)
  } else {
    console.log(`Seeded ${sampleEvents.length} sample events`)
  }
}

async function main() {
  console.log('Seeding Prythia database...')
  await seedCategories()
  await seedSampleEvents()
  console.log('Done!')
}

main().catch(console.error)
