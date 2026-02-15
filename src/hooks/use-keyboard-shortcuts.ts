'use client'

import { useEffect } from 'react'

interface ShortcutMap {
  [key: string]: () => void
}

/**
 * Global keyboard shortcuts.
 *
 * Shortcuts:
 * - /         Focus search
 * - w         Add/remove from watchlist
 * - a         Set alert
 * - ← / →    Navigate between events
 * - Esc       Close panel/modal
 * - d         Toggle density
 * - ?         Show shortcut cheat sheet
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Escape should still work
        if (event.key !== 'Escape') return
      }

      const handler = shortcuts[event.key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
