'use client'

const defaultPrompts = [
  'What changed most this week?',
  'Compare Fed rate cut vs hold probability',
  'Which geopolitical events have the most volume?',
  'Generate a risk briefing for my watchlist',
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
          className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
