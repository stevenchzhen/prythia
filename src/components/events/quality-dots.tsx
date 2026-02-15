interface QualityDotsProps {
  score: number // 0.0 to 1.0
  maxDots?: number
}

export function QualityDots({ score, maxDots = 4 }: QualityDotsProps) {
  const filled = Math.round(score * maxDots)

  return (
    <span className="inline-flex gap-0.5" title={`Quality: ${(score * 100).toFixed(0)}%`}>
      {Array.from({ length: maxDots }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i < filled ? 'bg-white' : 'bg-slate-600'
          }`}
        />
      ))}
    </span>
  )
}
