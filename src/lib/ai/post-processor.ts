/**
 * Post-process AI output:
 * - Validate that cited probabilities match the database
 * - Inject inline data cards for referenced events
 * - Add disclaimer footer
 * - Log query for usage analytics
 */

interface ProcessedOutput {
  content: string
  eventIds: string[]
}

export function postProcess(
  rawContent: string,
  relevantEvents: Record<string, unknown>[]
): ProcessedOutput {
  // Extract event IDs referenced in the response
  const eventIds = extractEventIds(rawContent, relevantEvents)

  // TODO: Validate that any probability numbers cited match our database
  // TODO: Inject inline data card markers for referenced events
  // TODO: Add disclaimer if not already present

  const disclaimer =
    '\n\n*This analysis is based on prediction market data and does not constitute financial or investment advice.*'

  const content = rawContent.includes('does not constitute')
    ? rawContent
    : rawContent + disclaimer

  return { content, eventIds }
}

function extractEventIds(
  content: string,
  events: Record<string, unknown>[]
): string[] {
  // Match event IDs in the format evt_xxx
  const explicitIds = content.match(/evt_[a-z0-9_]+/g) ?? []

  // Also check if any event titles are mentioned
  const mentionedEvents = events.filter((e) => {
    const title = (e.title as string).toLowerCase()
    // Check if key words from the title appear in the content
    const words = title.split(' ').filter((w) => w.length > 4)
    return words.some((w) => content.toLowerCase().includes(w))
  })

  const mentionedIds = mentionedEvents.map((e) => e.id as string)

  return [...new Set([...explicitIds, ...mentionedIds])]
}
