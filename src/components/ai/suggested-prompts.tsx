'use client'

const defaultPrompts = [
  'I run a supply chain company — what should I track?',
  'Help me understand prediction market data',
  'What are the biggest market movements this week?',
  'Set up a watchlist for US policy events',
]

interface SuggestedPromptsProps {
  prompts?: string[]
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ prompts = defaultPrompts, onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-[var(--primary-ghost)] px-3 py-1.5 text-xs text-zinc-400 hover:bg-[var(--primary-ghost)] hover:text-zinc-200 transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
