'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { SuggestedPrompts } from './suggested-prompts'
import { AIDataCard } from './ai-data-card'

interface EventRef {
  id: string
  title: string
  probability: number
  change24h: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  eventsReferenced?: EventRef[]
  error?: boolean
}

interface AIResponse {
  answer: string
  events_referenced: string[]
  confidence: string
  model_tier: string
  usage: Record<string, unknown>
  generated_at: string
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/v1/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error?.message ?? `Request failed (${res.status})`)
      }

      const data: AIResponse = await res.json()

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        eventsReferenced: [],
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        error: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handlePromptSelect = (prompt: string) => {
    sendMessage(prompt)
  }

  const clearConversation = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-[rgba(247,215,76,0.6)] text-2xl mb-2">&#10022;</div>
              <p className="text-sm text-zinc-400">Ask Prythia AI about prediction markets</p>
              <SuggestedPrompts onSelect={handlePromptSelect} />
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-xl rounded-br-sm bg-[var(--primary-subtle)] px-4 py-2.5">
                  <p className="text-sm text-zinc-200">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[rgba(247,215,76,0.7)] text-xs">&#10022;</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Prythia AI</span>
                </div>
                {msg.error ? (
                  <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 text-[#ef4444] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#ef4444]/80">{msg.content}</p>
                  </div>
                ) : (
                  <div className="rounded-xl rounded-bl-sm border border-[var(--primary-ghost)] bg-[rgba(12,13,20,0.72)] px-4 py-2.5 max-w-[90%]">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                )}
                {msg.eventsReferenced && msg.eventsReferenced.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-1">
                    {msg.eventsReferenced.map((ev) => (
                      <AIDataCard
                        key={ev.id}
                        eventId={ev.id}
                        title={ev.title}
                        probability={ev.probability}
                        change24h={ev.change24h}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[rgba(247,215,76,0.7)] text-xs">&#10022;</span>
              <span className="text-[11px] text-zinc-500 font-medium">Prythia AI</span>
            </div>
            <div className="rounded-xl rounded-bl-sm border border-[var(--primary-ghost)] bg-[rgba(12,13,20,0.72)] px-4 py-3 max-w-[90%]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[rgba(247,215,76,0.5)]" />
                <span className="text-xs text-zinc-500">Analyzing markets...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--primary-ghost)] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              className="text-zinc-500 hover:text-zinc-300 flex-shrink-0"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about prediction markets..."
            className="bg-[rgba(12,13,20,0.72)] border-[var(--primary-border)]"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
