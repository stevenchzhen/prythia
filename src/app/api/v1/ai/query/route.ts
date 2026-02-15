import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: AI query endpoint
  // 1. Authenticate
  // 2. Parse request body { question, context: { watchlist, categories, max_events } }
  // 3. Run RAG pipeline: query parser -> data retriever -> context builder -> LLM inference -> post-processor
  // 4. Return streamed or complete response

  return NextResponse.json({
    answer: 'AI query endpoint not yet implemented.',
    events_referenced: [],
    confidence: 'low',
    generated_at: new Date().toISOString(),
  }, { status: 501 })
}
