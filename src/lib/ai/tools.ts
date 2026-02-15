/**
 * Function-calling tool definitions for Claude.
 * These allow the LLM to query live data during inference.
 *
 * Format follows Anthropic's tool_use specification.
 * Internally stored in a shared format and converted to
 * Anthropic's ToolDefinition shape in the RAG pipeline.
 */

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_event_probability',
      description:
        'Get current probability and trend for a prediction market event',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID' },
          search_query: {
            type: 'string',
            description: 'Search query to find the event by name',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_events',
      description:
        'Search for prediction market events by keyword, category, or filters',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords' },
          category: { type: 'string', description: 'Category slug to filter' },
          prob_min: { type: 'number', description: 'Minimum probability' },
          prob_max: { type: 'number', description: 'Maximum probability' },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_event_history',
      description: 'Get historical probability time series for an event',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID' },
          days: {
            type: 'number',
            description: 'Number of days of history (default 30)',
          },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compare_events',
      description:
        'Compare probabilities and trends across multiple events',
      parameters: {
        type: 'object',
        properties: {
          event_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of event IDs to compare',
          },
        },
        required: ['event_ids'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_category_summary',
      description: 'Get aggregate statistics for a category of events',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category slug' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_watchlist',
      description: "Get the current user's watchlist with live data",
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]
