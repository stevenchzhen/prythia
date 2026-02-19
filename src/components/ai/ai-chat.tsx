'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Send,
  Loader2,
  AlertCircle,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { SuggestedPrompts } from './suggested-prompts'
import type { UserProfile } from '@/lib/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

interface Conversation {
  id: string
  title: string | null
  updated_at: string
  message_count: number
}

interface AIResponse {
  answer: string
  events_referenced: string[]
  model_tier: string
  usage: Record<string, unknown>
  generated_at: string
  conversation_id: string | null
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load conversation list and profile on mount
  useEffect(() => {
    loadConversations()
    fetch('/api/v1/profile')
      .then((r) => r.json())
      .then((d) => { if (d.data) setProfile(d.data) })
      .catch(() => {})
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/v1/ai/conversations')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.data ?? [])
    } catch {
      // Silently fail — user might not be logged in
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/v1/ai/conversations/${convId}`)
      if (!res.ok) return
      const data = await res.json()
      setConversationId(convId)
      setMessages(
        (data.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      )
    } catch {
      // ignore
    }
  }

  const deleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/v1/ai/conversations/${convId}`, { method: 'DELETE' })
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (conversationId === convId) {
        startNewChat()
      }
    } catch {
      // ignore
    }
  }

  const startNewChat = () => {
    setConversationId(null)
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question.trim(),
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/v1/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.error?.message ?? `Request failed (${res.status})`)
        }

        const data: AIResponse = await res.json()

        // Update conversation ID if this is a new conversation
        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id)
          loadConversations()
        }

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
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
    },
    [isLoading, messages, conversationId]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handlePromptSelect = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 border-r border-[var(--primary-ghost)] flex flex-col">
          <div className="p-3 border-b border-[var(--primary-ghost)] flex items-center justify-between">
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                  conv.id === conversationId
                    ? 'bg-[var(--primary-ghost)] text-zinc-200'
                    : 'text-zinc-500 hover:bg-[rgba(255,255,255,0.03)] hover:text-zinc-300'
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs truncate flex-1">
                  {conv.title || 'New conversation'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                  className="hidden group-hover:block text-zinc-600 hover:text-[#ef4444] transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center py-4">No conversations yet</p>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with sidebar toggle */}
        {!sidebarOpen && (
          <div className="p-2 border-b border-[var(--primary-ghost)]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
            >
              <PanelLeftOpen className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-[rgba(247,215,76,0.6)] text-2xl mb-2">&#10022;</div>
                <p className="text-sm text-zinc-400">Ask Prythia AI about prediction markets</p>
                <SuggestedPrompts profile={profile} onSelect={handlePromptSelect} />
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
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:text-zinc-300 [&_p]:leading-relaxed [&_li]:text-zinc-300 [&_strong]:text-zinc-200 [&_h1]:text-zinc-200 [&_h2]:text-zinc-200 [&_h3]:text-zinc-200 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-[rgba(247,215,76,0.8)] [&_code]:bg-[rgba(247,215,76,0.1)] [&_code]:px-1 [&_code]:rounded [&_a]:text-[rgba(247,215,76,0.8)] [&_hr]:border-[var(--primary-ghost)]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
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
    </div>
  )
}
