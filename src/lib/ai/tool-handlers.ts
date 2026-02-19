/**
 * Tool execution handlers for AI function calls.
 * Each handler queries Supabase and returns a formatted string for Claude.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'

type ToolInput = Record<string, unknown>

const handlers: Record<string, (input: ToolInput, userId?: string) => Promise<string>> = {
  search_events: searchEvents,
  get_event_probability: getEventProbability,
  get_event_history: getEventHistory,
  compare_events: compareEvents,
  get_category_summary: getCategorySummary,
  get_user_watchlist: getUserWatchlist,
  add_to_watchlist: addToWatchlist,
  remove_from_watchlist: removeFromWatchlist,
  create_alert: createAlert,
}

export async function executeTool(
  name: string,
  input: ToolInput,
  userId?: string
): Promise<string> {
  const handler = handlers[name]
  if (!handler) return `Unknown tool: ${name}`

  try {
    return await handler(input, userId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Tool execution failed'
    return `Error executing ${name}: ${msg}`
  }
}

async function searchEvents(input: ToolInput): Promise<string> {
  const admin = getSupabaseAdmin()
  const query = input.query as string | undefined
  const category = input.category as string | undefined
  const probMin = input.prob_min as number | undefined
  const probMax = input.prob_max as number | undefined
  const limit = Math.min((input.limit as number) || 10, 20)

  let dbQuery = admin
    .from('events')
    .select('id, title, category, probability, prob_change_24h, volume_24h, source_count, max_spread, resolution_date')
    .eq('resolution_status', 'open')
    .eq('is_active', true)
    .is('parent_event_id', null)
    .or('outcome_type.eq.binary,outcome_type.is.null')
    .order('volume_24h', { ascending: false })
    .limit(limit)

  if (query) {
    dbQuery = dbQuery.textSearch('fts', query.split(/\s+/).join(' & '), { type: 'websearch' })
  }
  if (category) {
    dbQuery = dbQuery.eq('category', category)
  }
  if (probMin !== undefined) {
    dbQuery = dbQuery.gte('probability', probMin)
  }
  if (probMax !== undefined) {
    dbQuery = dbQuery.lte('probability', probMax)
  }

  const { data, error } = await dbQuery
  if (error) return `Search error: ${error.message}`
  if (!data || data.length === 0) return 'No events found matching your search.'

  return data
    .map((e) => {
      const prob = e.probability != null ? `${(e.probability * 100).toFixed(1)}%` : 'N/A'
      const change = e.prob_change_24h != null ? `${e.prob_change_24h > 0 ? '+' : ''}${(e.prob_change_24h * 100).toFixed(1)}%` : ''
      const vol = e.volume_24h != null ? `$${Math.round(e.volume_24h).toLocaleString()}` : ''
      const spread = e.max_spread != null && e.max_spread > 0.01 ? ` | spread: ${(e.max_spread * 100).toFixed(1)}%` : ''
      return `- [${e.id}] ${e.title} | ${prob} (24h: ${change}) | vol: ${vol} | ${e.source_count ?? 0} sources${spread}`
    })
    .join('\n')
}

async function getEventProbability(input: ToolInput): Promise<string> {
  const admin = getSupabaseAdmin()
  const eventId = input.event_id as string | undefined
  const searchQuery = input.search_query as string | undefined

  let event
  if (eventId) {
    const { data } = await admin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    event = data
  } else if (searchQuery) {
    const { data } = await admin
      .from('events')
      .select('*')
      .textSearch('fts', searchQuery.split(/\s+/).join(' & '), { type: 'websearch' })
      .is('parent_event_id', null)
      .or('outcome_type.eq.binary,outcome_type.is.null')
      .limit(1)
      .single()
    event = data
  }

  if (!event) return 'Event not found.'

  const prob = event.probability != null ? `${(event.probability * 100).toFixed(1)}%` : 'N/A'
  const c24h = event.prob_change_24h != null ? `${event.prob_change_24h > 0 ? '+' : ''}${(event.prob_change_24h * 100).toFixed(1)}%` : 'N/A'
  const c7d = event.prob_change_7d != null ? `${event.prob_change_7d > 0 ? '+' : ''}${(event.prob_change_7d * 100).toFixed(1)}%` : 'N/A'
  const c30d = event.prob_change_30d != null ? `${event.prob_change_30d > 0 ? '+' : ''}${(event.prob_change_30d * 100).toFixed(1)}%` : 'N/A'

  return [
    `Event: ${event.title} [${event.id}]`,
    `Category: ${event.category}`,
    `Probability: ${prob}`,
    `Change: 24h ${c24h} | 7d ${c7d} | 30d ${c30d}`,
    `30d range: ${event.prob_low_30d != null ? (event.prob_low_30d * 100).toFixed(0) : '?'}% - ${event.prob_high_30d != null ? (event.prob_high_30d * 100).toFixed(0) : '?'}%`,
    `Volume (24h): $${event.volume_24h != null ? Math.round(event.volume_24h).toLocaleString() : 'N/A'}`,
    `Sources: ${event.source_count ?? 0} platforms`,
    `Quality: ${event.quality_score != null ? (event.quality_score * 100).toFixed(0) + '%' : 'N/A'}`,
    event.max_spread != null && event.max_spread > 0.01 ? `Cross-platform spread: ${(event.max_spread * 100).toFixed(1)}%` : '',
    event.resolution_date ? `Resolution date: ${event.resolution_date}` : '',
    event.description ? `\nDescription: ${event.description}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

async function getEventHistory(input: ToolInput): Promise<string> {
  const admin = getSupabaseAdmin()
  const eventId = input.event_id as string
  const days = Math.min((input.days as number) || 30, 90)

  const since = new Date()
  since.setDate(since.getDate() - days)

  // Fetch history and event title in parallel
  const [historyResult, eventResult] = await Promise.all([
    admin
      .from('daily_stats')
      .select('date, prob_open, prob_close, prob_high, prob_low, volume_total')
      .eq('event_id', eventId)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    admin
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single(),
  ])

  const { data, error } = historyResult
  if (error) return `History error: ${error.message}`
  if (!data || data.length === 0) return 'No historical data available for this event.'

  const header = `History for ${eventResult.data?.title ?? eventId} (last ${days} days, ${data.length} data points):\n`

  const first = data[0]
  const last = data[data.length - 1]
  const allCloses = data.map((d) => d.prob_close).filter((v): v is number => v != null)
  const high = Math.max(...allCloses)
  const low = Math.min(...allCloses)

  const summary = [
    `Start: ${first.prob_close != null ? (first.prob_close * 100).toFixed(1) : '?'}% (${first.date})`,
    `Current: ${last.prob_close != null ? (last.prob_close * 100).toFixed(1) : '?'}% (${last.date})`,
    `Period high: ${(high * 100).toFixed(1)}%`,
    `Period low: ${(low * 100).toFixed(1)}%`,
  ].join('\n')

  const recent = data.slice(-10)
  const table = recent
    .map((d) => `  ${d.date}: ${d.prob_close != null ? (d.prob_close * 100).toFixed(1) : '?'}% (vol: $${d.volume_total != null ? Math.round(d.volume_total).toLocaleString() : '0'})`)
    .join('\n')

  return `${header}${summary}\n\nRecent:\n${table}`
}

async function compareEvents(input: ToolInput): Promise<string> {
  const admin = getSupabaseAdmin()
  const eventIds = input.event_ids as string[]
  if (!eventIds?.length) return 'No event IDs provided.'

  const { data, error } = await admin
    .from('events')
    .select('id, title, category, probability, prob_change_24h, prob_change_7d, volume_24h, source_count, max_spread')
    .in('id', eventIds)

  if (error) return `Comparison error: ${error.message}`
  if (!data || data.length === 0) return 'No events found for the given IDs.'

  return data
    .map((e) => {
      const prob = e.probability != null ? `${(e.probability * 100).toFixed(1)}%` : 'N/A'
      const c24h = e.prob_change_24h != null ? `${e.prob_change_24h > 0 ? '+' : ''}${(e.prob_change_24h * 100).toFixed(1)}%` : 'N/A'
      const c7d = e.prob_change_7d != null ? `${e.prob_change_7d > 0 ? '+' : ''}${(e.prob_change_7d * 100).toFixed(1)}%` : 'N/A'
      const spread = e.max_spread != null && e.max_spread > 0.01 ? `spread: ${(e.max_spread * 100).toFixed(1)}%` : ''
      return `[${e.id}] ${e.title}\n  Prob: ${prob} | 24h: ${c24h} | 7d: ${c7d} | Vol: $${e.volume_24h != null ? Math.round(e.volume_24h).toLocaleString() : '0'} | ${e.source_count ?? 0} sources ${spread}`
    })
    .join('\n\n')
}

async function getCategorySummary(input: ToolInput): Promise<string> {
  const admin = getSupabaseAdmin()
  const category = input.category as string

  const { data, error } = await admin
    .from('events')
    .select('id, title, probability, prob_change_24h, volume_24h')
    .eq('category', category)
    .eq('resolution_status', 'open')
    .eq('is_active', true)
    .is('parent_event_id', null)
    .or('outcome_type.eq.binary,outcome_type.is.null')
    .order('volume_24h', { ascending: false })
    .limit(15)

  if (error) return `Category error: ${error.message}`
  if (!data || data.length === 0) return `No active events in category "${category}".`

  const probs = data.map((e) => e.probability).filter((p): p is number => p != null)
  const avgProb = probs.length > 0 ? probs.reduce((a, b) => a + b, 0) / probs.length : 0
  const totalVol = data.reduce((sum, e) => sum + (e.volume_24h ?? 0), 0)

  const header = `Category: ${category} | ${data.length} active events | Avg prob: ${(avgProb * 100).toFixed(1)}% | Total 24h vol: $${Math.round(totalVol).toLocaleString()}\n`

  const list = data
    .map((e) => {
      const prob = e.probability != null ? `${(e.probability * 100).toFixed(1)}%` : 'N/A'
      const change = e.prob_change_24h != null ? `${e.prob_change_24h > 0 ? '+' : ''}${(e.prob_change_24h * 100).toFixed(1)}%` : ''
      return `  - ${e.title}: ${prob} (${change})`
    })
    .join('\n')

  return `${header}\n${list}`
}

async function getUserWatchlist(_input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot access watchlist.'
  const admin = getSupabaseAdmin()

  const { data: items, error } = await admin
    .from('watchlist_items')
    .select('event_id, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })

  if (error) return `Watchlist error: ${error.message}`
  if (!items || items.length === 0) return 'Your watchlist is empty.'

  const eventIds = items.map((i) => i.event_id)
  const { data: events } = await admin
    .from('events')
    .select('id, title, probability, prob_change_24h, volume_24h, category')
    .in('id', eventIds)

  if (!events || events.length === 0) return 'Your watchlist is empty (events not found).'

  return events
    .map((e) => {
      const prob = e.probability != null ? `${(e.probability * 100).toFixed(1)}%` : 'N/A'
      const change = e.prob_change_24h != null ? `${e.prob_change_24h > 0 ? '+' : ''}${(e.prob_change_24h * 100).toFixed(1)}%` : ''
      return `- [${e.id}] ${e.title} | ${prob} (24h: ${change}) | ${e.category}`
    })
    .join('\n')
}

async function addToWatchlist(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot modify watchlist.'
  const admin = getSupabaseAdmin()

  const eventId = input.event_id as string
  if (!eventId) return 'event_id is required.'

  const { data: event } = await admin
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .single()

  if (!event) return `Event "${eventId}" not found.`

  let { data: group } = await admin
    .from('watchlist_groups')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Default')
    .single()

  if (!group) {
    const { data: newGroup } = await admin
      .from('watchlist_groups')
      .insert({ user_id: userId, name: 'Default' })
      .select('id')
      .single()
    group = newGroup
  }

  if (!group) return 'Failed to get watchlist group.'

  const { error } = await admin
    .from('watchlist_items')
    .upsert(
      { group_id: group.id, user_id: userId, event_id: eventId },
      { onConflict: 'user_id,event_id' }
    )

  if (error) return `Failed to add to watchlist: ${error.message}`
  return `Added "${event.title}" to your watchlist.`
}

async function removeFromWatchlist(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot modify watchlist.'
  const admin = getSupabaseAdmin()

  const eventId = input.event_id as string
  if (!eventId) return 'event_id is required.'

  const { error, count } = await admin
    .from('watchlist_items')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('event_id', eventId)

  if (error) return `Failed to remove from watchlist: ${error.message}`
  if (count === 0) return 'Event was not on your watchlist.'
  return 'Removed from your watchlist.'
}

async function createAlert(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot create alert.'
  const admin = getSupabaseAdmin()

  const eventId = input.event_id as string
  const alertType = input.alert_type as string
  const condition = input.condition as Record<string, unknown>

  if (!eventId) return 'event_id is required.'
  if (!alertType) return 'alert_type is required.'

  const { data: event } = await admin
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .single()

  if (!event) return `Event "${eventId}" not found.`

  const { error } = await admin
    .from('alerts')
    .insert({
      user_id: userId,
      event_id: eventId,
      alert_type: alertType,
      condition: condition ?? {},
      channels: ['in_app'],
      frequency: 'once_per_hour',
      is_active: true,
    })

  if (error) return `Failed to create alert: ${error.message}`
  return `Alert created for "${event.title}" (type: ${alertType}).`
}
