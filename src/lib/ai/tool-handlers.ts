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
  save_user_profile: saveUserProfile,
  create_decision: createDecision,
  get_my_decisions: getMyDecisions,
  link_event_to_decision: linkEventToDecision,
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

async function saveUserProfile(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot save profile.'
  const admin = getSupabaseAdmin()

  const industry = input.industry as string | undefined
  const role = input.role as string | undefined
  const companyDescription = input.company_description as string | undefined
  const keyConcerns = input.key_concerns as string[] | undefined

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (industry) updates.industry = industry
  if (role) updates.role = role
  if (companyDescription) updates.company_description = companyDescription
  if (keyConcerns) updates.key_concerns = keyConcerns

  // Check if profile already exists
  const { data: existing } = await admin
    .from('user_preferences')
    .select('profile_completed_at')
    .eq('user_id', userId)
    .single()

  if (!existing?.profile_completed_at) {
    updates.profile_completed_at = new Date().toISOString()
  }

  const { error } = await admin
    .from('user_preferences')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })

  if (error) return `Failed to save profile: ${error.message}`

  const saved = [
    industry && `Industry: ${industry}`,
    role && `Role: ${role}`,
    companyDescription && `Company: ${companyDescription}`,
    keyConcerns?.length && `Key concerns: ${keyConcerns.join(', ')}`,
  ].filter(Boolean)

  return `Profile saved!\n${saved.join('\n')}`
}

async function createDecision(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot create decision.'
  const admin = getSupabaseAdmin()

  const title = input.title as string
  if (!title) return 'title is required.'

  const description = input.description as string | undefined
  const decisionType = (input.decision_type as string) || 'other'
  const deadline = input.deadline as string | undefined
  const tags = input.tags as string[] | undefined

  const { data: decision, error } = await admin
    .from('user_decisions')
    .insert({
      user_id: userId,
      title,
      description: description ?? null,
      decision_type: decisionType,
      deadline: deadline ?? null,
      tags: tags ?? [],
    })
    .select('id')
    .single()

  if (error) return `Failed to create decision: ${error.message}`
  if (!decision) return 'Failed to create decision.'

  // Auto-match: search for relevant events using title + description
  const searchText = [title, description].filter(Boolean).join(' ')
  const searchTerms = searchText.split(/\s+/).slice(0, 6).join(' & ')

  const { data: matchedEvents } = await admin
    .from('events')
    .select('id, title, probability')
    .textSearch('fts', searchTerms, { type: 'websearch' })
    .eq('resolution_status', 'open')
    .eq('is_active', true)
    .is('parent_event_id', null)
    .or('outcome_type.eq.binary,outcome_type.is.null')
    .order('volume_24h', { ascending: false })
    .limit(3)

  const linkedEvents: string[] = []
  if (matchedEvents && matchedEvents.length > 0) {
    for (const evt of matchedEvents) {
      await admin
        .from('decision_event_links')
        .insert({
          decision_id: decision.id,
          event_id: evt.id,
          link_source: 'ai',
          prob_at_link: evt.probability,
        })
      const prob = evt.probability != null ? `${(evt.probability * 100).toFixed(1)}%` : 'N/A'
      linkedEvents.push(`  - [${evt.id}] ${evt.title} (${prob})`)
    }
  }

  let result = `Decision logged: "${title}" (${decision.id})`
  if (linkedEvents.length > 0) {
    result += `\n\nAuto-matched ${linkedEvents.length} relevant events:\n${linkedEvents.join('\n')}`
  } else {
    result += '\n\nNo events auto-matched. You can link events manually using link_event_to_decision.'
  }

  return result
}

async function getMyDecisions(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot fetch decisions.'
  const admin = getSupabaseAdmin()

  const statusFilter = (input.status as string) || 'active'

  let dbQuery = admin
    .from('user_decisions')
    .select('id, title, description, decision_type, status, deadline, decided_at, outcome_notes, tags, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    dbQuery = dbQuery.eq('status', statusFilter)
  }

  const { data: decisions, error } = await dbQuery
  if (error) return `Failed to fetch decisions: ${error.message}`
  if (!decisions || decisions.length === 0) {
    return statusFilter === 'all'
      ? 'No decisions in your journal yet.'
      : `No ${statusFilter} decisions.`
  }

  // Fetch links for all decisions
  const decisionIds = decisions.map((d) => d.id)
  const { data: links } = await admin
    .from('decision_event_links')
    .select('decision_id, event_id, prob_at_link, relevance_note')
    .in('decision_id', decisionIds)

  // Fetch live event data for all linked events
  const eventIds = [...new Set((links ?? []).map((l) => l.event_id))]
  let eventsMap: Record<string, { title: string; probability: number | null; prob_change_24h: number | null }> = {}
  if (eventIds.length > 0) {
    const { data: events } = await admin
      .from('events')
      .select('id, title, probability, prob_change_24h')
      .in('id', eventIds)
    if (events) {
      eventsMap = Object.fromEntries(events.map((e) => [e.id, e]))
    }
  }

  return decisions.map((d) => {
    const decLinks = (links ?? []).filter((l) => l.decision_id === d.id)
    const deadline = d.deadline ? ` | deadline: ${d.deadline}` : ''
    const status = d.status === 'decided' ? ' [DECIDED]' : ''

    let entry = `**${d.title}**${status} (${d.id})\n  Type: ${d.decision_type}${deadline}`

    if (d.outcome_notes) {
      entry += `\n  Outcome: ${d.outcome_notes}`
    }

    if (decLinks.length > 0) {
      entry += '\n  Linked events:'
      for (const link of decLinks) {
        const evt = eventsMap[link.event_id]
        if (evt) {
          const currentProb = evt.probability != null ? `${(evt.probability * 100).toFixed(1)}%` : 'N/A'
          const linkedProb = link.prob_at_link != null ? `${(Number(link.prob_at_link) * 100).toFixed(1)}%` : '?'
          const change24h = evt.prob_change_24h != null ? `${evt.prob_change_24h > 0 ? '+' : ''}${(evt.prob_change_24h * 100).toFixed(1)}%` : ''
          entry += `\n    - ${evt.title}: ${currentProb} (was ${linkedProb} when linked, 24h: ${change24h})`
        }
      }
    }

    return entry
  }).join('\n\n')
}

async function linkEventToDecision(input: ToolInput, userId?: string): Promise<string> {
  if (!userId) return 'No user session — cannot link event.'
  const admin = getSupabaseAdmin()

  const decisionId = input.decision_id as string
  const eventId = input.event_id as string
  const relevanceNote = input.relevance_note as string | undefined

  if (!decisionId) return 'decision_id is required.'
  if (!eventId) return 'event_id is required.'

  // Verify decision ownership
  const { data: decision } = await admin
    .from('user_decisions')
    .select('id, title')
    .eq('id', decisionId)
    .eq('user_id', userId)
    .single()

  if (!decision) return 'Decision not found or not owned by you.'

  // Verify event exists and get current probability
  const { data: event } = await admin
    .from('events')
    .select('id, title, probability')
    .eq('id', eventId)
    .single()

  if (!event) return `Event "${eventId}" not found.`

  const { error } = await admin
    .from('decision_event_links')
    .upsert(
      {
        decision_id: decisionId,
        event_id: eventId,
        link_source: 'ai',
        prob_at_link: event.probability,
        relevance_note: relevanceNote ?? null,
      },
      { onConflict: 'decision_id,event_id' }
    )

  if (error) return `Failed to link event: ${error.message}`

  const prob = event.probability != null ? `${(event.probability * 100).toFixed(1)}%` : 'N/A'
  return `Linked "${event.title}" (${prob}) to decision "${decision.title}".`
}
