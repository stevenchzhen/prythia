import { queryFast, queryHeavy, parseResponse, type Message, type ContentBlock, type ToolDefinition } from './client'
import { tools as aiToolDefs } from './tools'
import { buildSystemPrompt } from './prompts'
import { executeTool } from './tool-handlers'

const MAX_TOOL_ITERATIONS = 5

interface RAGQuery {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  userId?: string
  useHeavyModel?: boolean
}

/**
 * RAG pipeline with tool execution loop.
 *
 * 1. Send conversation + tools to Claude
 * 2. If Claude responds with tool_use blocks, execute each tool
 * 3. Append tool_use + tool_result to messages, loop
 * 4. Return final text response
 */
export async function runRAGPipeline(query: RAGQuery) {
  const systemPrompt = buildSystemPrompt()

  // Convert tool definitions to Anthropic format
  const tools: ToolDefinition[] = aiToolDefs.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Record<string, unknown>,
  }))

  // Build message history in Anthropic format
  const messages: Message[] = query.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const queryFn = query.useHeavyModel ? queryHeavy : queryFast
  const totalUsage = { input_tokens: 0, output_tokens: 0 }
  let finalText = ''
  const eventsReferenced: string[] = []

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await queryFn(messages, { system: systemPrompt, maxTokens: 4096 }, tools)
    const result = await parseResponse(response)

    totalUsage.input_tokens += result.usage.input_tokens
    totalUsage.output_tokens += result.usage.output_tokens

    // If no tool calls, we have the final text response
    if (result.toolCalls.length === 0 || result.stopReason === 'end_turn') {
      finalText = result.text
      break
    }

    // Claude responded with tool calls — build the assistant message with all content blocks
    const assistantContent: ContentBlock[] = []
    if (result.text) {
      assistantContent.push({ type: 'text', text: result.text })
    }
    for (const tc of result.toolCalls) {
      assistantContent.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.name,
        input: tc.input,
      })
    }

    messages.push({ role: 'assistant', content: assistantContent })

    // Execute each tool and build tool_result blocks
    const toolResults: ContentBlock[] = []
    for (const tc of result.toolCalls) {
      const toolOutput = await executeTool(tc.name!, tc.input ?? {}, query.userId)

      // Extract event IDs from tool output
      const idMatches = toolOutput.match(/\[([^\]]+)\]/g)
      if (idMatches) {
        eventsReferenced.push(...idMatches.map((m) => m.slice(1, -1)).filter((id) => id.startsWith('evt_') || id.length > 5))
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: tc.id,
        content: toolOutput,
      })
    }

    messages.push({ role: 'user', content: toolResults })

    // If this was the last iteration, get a final response without tools
    if (i === MAX_TOOL_ITERATIONS - 1) {
      const finalResponse = await queryFn(messages, { system: systemPrompt, maxTokens: 4096 })
      const finalResult = await parseResponse(finalResponse)
      finalText = finalResult.text
      totalUsage.input_tokens += finalResult.usage.input_tokens
      totalUsage.output_tokens += finalResult.usage.output_tokens
    }
  }

  return {
    answer: finalText,
    events_referenced: [...new Set(eventsReferenced)],
    model_tier: query.useHeavyModel ? 'heavy' : 'fast',
    usage: totalUsage,
    generated_at: new Date().toISOString(),
  }
}
