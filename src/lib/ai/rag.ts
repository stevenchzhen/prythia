import { supabaseAdmin } from '@/lib/supabase/admin'
import { queryFast, queryHeavy, parseResponse, type Message, type ToolDefinition } from './client'
import { tools as aiToolDefs } from './tools'
import { buildSystemPrompt } from './prompts'
import { postProcess } from './post-processor'

interface RAGQuery {
  question: string
  userId?: string
  categories?: string[]
  maxEvents?: number
  includeWatchlist?: boolean
  /** Use Sonnet for complex queries (scenario analysis, multi-event correlation) */
  useHeavyModel?: boolean
}

/**
 * Full RAG pipeline: query → retrieve → build context → generate → post-process.
 */
export async function runRAGPipeline(query: RAGQuery) {
  // 1. Retrieve relevant events from the database
  const relevantEvents = await retrieveRelevantEvents(query)

  // 2. Build context and messages
  const systemPrompt = buildSystemPrompt()
  const contextMessage = buildContextMessage(relevantEvents, query)

  const messages: Message[] = [
    { role: 'user', content: contextMessage },
  ]

  // 3. Convert tool definitions to Anthropic format
  const tools: ToolDefinition[] = aiToolDefs.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Record<string, unknown>,
  }))

  // 4. Route to Haiku (fast) or Sonnet (heavy) based on query complexity
  const queryFn = query.useHeavyModel ? queryHeavy : queryFast
  const response = await queryFn(messages, { system: systemPrompt }, tools)
  const result = await parseResponse(response)

  // 5. Post-process: validate data, inject event cards, add disclaimer
  const processed = postProcess(result.text, relevantEvents)

  return {
    answer: processed.content,
    events_referenced: processed.eventIds,
    confidence: relevantEvents.length > 0 ? 'high' : 'low',
    model_tier: query.useHeavyModel ? 'heavy' : 'fast',
    usage: result.usage,
    generated_at: new Date().toISOString(),
  }
}

async function retrieveRelevantEvents(query: RAGQuery) {
  let dbQuery = supabaseAdmin
    .from('events')
    .select('*')
    .eq('resolution_status', 'open')
    .order('volume_24h', { ascending: false })
    .limit(query.maxEvents ?? 20)

  if (query.categories?.length) {
    dbQuery = dbQuery.in('category', query.categories)
  }

  const { data } = await dbQuery
  return data ?? []
}

function buildContextMessage(events: Record<string, unknown>[], query: RAGQuery): string {
  const eventSummary = events
    .map(
      (e) =>
        `- ${e.title}: ${((e.probability as number) * 100).toFixed(1)}% (24h: ${e.prob_change_24h}, vol: $${e.volume_24h})`
    )
    .join('\n')

  return `${query.question}\n\nRelevant prediction market data:\n${eventSummary}`
}
