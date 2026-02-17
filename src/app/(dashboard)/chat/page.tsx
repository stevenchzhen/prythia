'use client'

import { AIChat } from '@/components/ai/ai-chat'

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] flex-col -m-6 -mb-6">
      <AIChat />
    </div>
  )
}
