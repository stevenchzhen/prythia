'use client'

import type { UserProfile } from '@/lib/types'

const defaultPrompts = [
  'Help me set up my business profile',
  'I run a supply chain company — what should I track?',
  'What are the biggest market movements this week?',
  'Help me understand prediction market data',
]

function getProfilePrompts(profile: UserProfile): string[] {
  const prompts: string[] = []

  if (profile.industry) {
    prompts.push(`What's happening in ${profile.industry} this week?`)
  }

  prompts.push('Show my active decisions')

  if (profile.key_concerns && profile.key_concerns.length > 0) {
    prompts.push(`Any updates on ${profile.key_concerns[0]}?`)
  }

  prompts.push('Help me log a new business decision')

  return prompts.slice(0, 4)
}

interface SuggestedPromptsProps {
  prompts?: string[]
  profile?: UserProfile | null
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ prompts, profile, onSelect }: SuggestedPromptsProps) {
  const displayPrompts = prompts
    ?? (profile?.profile_completed_at ? getProfilePrompts(profile) : defaultPrompts)

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {displayPrompts.map((prompt) => (
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
