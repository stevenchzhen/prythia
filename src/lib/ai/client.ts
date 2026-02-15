/**
 * AI inference client — Anthropic Claude API.
 *
 * Model routing strategy:
 * - Claude Haiku (~80% of calls): Event analysis, chat Q&A, daily summaries,
 *   data retrieval, routine classification. Fast and cheap.
 * - Claude Sonnet (~20% of calls): Complex scenario analysis, multi-event
 *   correlation, report generation, nuanced geopolitical reasoning.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export type ModelTier = 'fast' | 'heavy'

// Model IDs — update when new versions release
const MODELS: Record<ModelTier, string> = {
  fast: 'claude-3-5-haiku-20241022',
  heavy: 'claude-3-5-sonnet-20241022',
}

export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
}

export interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface AIClientOptions {
  tier?: ModelTier
  maxTokens?: number
  temperature?: number
  system?: string
  stream?: boolean
}

const defaultOptions: AIClientOptions = {
  tier: 'fast',
  maxTokens: 2000,
  temperature: 0.3, // Lower temp for factual analysis
  stream: false,
}

/**
 * Query Claude API with automatic model routing.
 *
 * Use tier: 'fast' (Haiku) for most tasks.
 * Use tier: 'heavy' (Sonnet) for complex reasoning.
 */
export async function queryAI(
  messages: Message[],
  options: AIClientOptions = {},
  tools?: ToolDefinition[]
) {
  const opts = { ...defaultOptions, ...options }
  const model = MODELS[opts.tier ?? 'fast']

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
  }

  if (opts.system) {
    body.system = opts.system
  }

  if (tools && tools.length > 0) {
    body.tools = tools
  }

  if (opts.stream) {
    body.stream = true
  }

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error: ${response.status} ${errorText}`)
  }

  return response
}

/**
 * Convenience: query with Haiku (fast, cheap — 80% of calls).
 */
export function queryFast(
  messages: Message[],
  options: Omit<AIClientOptions, 'tier'> = {},
  tools?: ToolDefinition[]
) {
  return queryAI(messages, { ...options, tier: 'fast' }, tools)
}

/**
 * Convenience: query with Sonnet (heavy lifting — 20% of calls).
 */
export function queryHeavy(
  messages: Message[],
  options: Omit<AIClientOptions, 'tier'> = {},
  tools?: ToolDefinition[]
) {
  return queryAI(messages, { ...options, tier: 'heavy' }, tools)
}

/**
 * Parse a non-streaming Claude response into text.
 */
export async function parseResponse(response: Response): Promise<{
  text: string
  toolCalls: ContentBlock[]
  stopReason: string
  usage: { input_tokens: number; output_tokens: number }
}> {
  const data = await response.json()

  const textBlocks = (data.content ?? []).filter(
    (b: ContentBlock) => b.type === 'text'
  )
  const toolCalls = (data.content ?? []).filter(
    (b: ContentBlock) => b.type === 'tool_use'
  )

  return {
    text: textBlocks.map((b: ContentBlock) => b.text).join(''),
    toolCalls,
    stopReason: data.stop_reason ?? 'end_turn',
    usage: data.usage ?? { input_tokens: 0, output_tokens: 0 },
  }
}
