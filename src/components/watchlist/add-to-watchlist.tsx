'use client'

import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddToWatchlistProps {
  eventId: string
  isWatched?: boolean
  onToggle?: () => void
}

export function AddToWatchlist({ eventId: _eventId, isWatched = false, onToggle }: AddToWatchlistProps) {
  // TODO: Toggle watchlist membership, pick group via dropdown

  return (
    <Button
      variant={isWatched ? 'default' : 'outline'}
      size="sm"
      onClick={onToggle}
      className="gap-2"
    >
      <Bookmark className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
      {isWatched ? 'Watching' : 'Add to Watchlist'}
    </Button>
  )
}
