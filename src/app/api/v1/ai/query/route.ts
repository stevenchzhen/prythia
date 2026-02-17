import { NextRequest, NextResponse } from 'next/server'
import { runRAGPipeline } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, categories, maxEvents, useHeavyModel } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'question is required' } },
        { status: 400 }
      )
    }

    const result = await runRAGPipeline({
      question,
      categories: categories ?? undefined,
      maxEvents: maxEvents ?? undefined,
      useHeavyModel: useHeavyModel ?? false,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI query failed'
    return NextResponse.json(
      { error: { code: 'AI_ERROR', message } },
      { status: 500 }
    )
  }
}
