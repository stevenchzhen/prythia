'use client'

import { Command } from 'cmdk'

export function CommandPalette() {
  // TODO: Implement Cmd+K command palette
  // - Search events by title
  // - Quick navigation to pages
  // - Filter shortcuts
  return (
    <Command label="Command Menu">
      <Command.Input placeholder="Search events..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        {/* TODO: Dynamic event search results */}
        {/* TODO: Navigation commands */}
      </Command.List>
    </Command>
  )
}
