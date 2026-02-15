'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { SuggestedPrompts } from './suggested-prompts'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  // TODO: Implement AI chat
  // - Stream responses token-by-token
  // - Embed inline data cards for referenced events
  // - Persist conversations to ai_conversations/ai_messages tables
  // - Copy button on each AI response

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    // TODO: Send to /api/v1/ai/query
    setInput('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-lg text-slate-400">Ask Prythia AI about prediction markets</p>
              <SuggestedPrompts onSelect={setInput} />
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.role === 'assistant' ? 'border-l-2 border-purple-500 pl-4' : ''}`}>
            <p className="text-xs text-slate-400 mb-1">
              {msg.role === 'assistant' ? '✦ Prythia AI' : 'You'}
            </p>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question..."
          className="bg-slate-900 border-slate-700"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
