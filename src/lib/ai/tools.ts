/**
 * Function-calling tool definitions for Claude.
 * Format follows Anthropic's tool_use specification.
 */

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_events',
      description:
        'Search for prediction market events by keyword, category, or filters. Use this to find events relevant to the user\'s interests.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords' },
          category: { type: 'string', description: 'Category slug to filter' },
          prob_min: { type: 'number', description: 'Minimum probability (0-1)' },
          prob_max: { type: 'number', description: 'Maximum probability (0-1)' },
          limit: { type: 'number', description: 'Max results (default 10, max 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_event_probability',
      description:
        'Get current probability, trends, and details for a specific prediction market event',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID' },
          search_query: {
            type: 'string',
            description: 'Search query to find the event by name (use if event_id is unknown)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_event_history',
      description: 'Get historical probability data and trends for an event over time',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID' },
          days: {
            type: 'number',
            description: 'Number of days of history (default 30, max 90)',
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
        'Compare probabilities and trends across multiple events side-by-side',
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
      description: 'Get aggregate statistics and top events for a category',
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
      description: "Get the current user's watchlist with live probability data",
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_to_watchlist',
      description:
        'Add a prediction market event to the user\'s watchlist. Can be called multiple times to add several events.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID to add' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_from_watchlist',
      description: 'Remove a prediction market event from the user\'s watchlist',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID to remove' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_alert',
      description:
        'Create an alert for a prediction market event. Alerts notify the user when conditions are met.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The event ID' },
          alert_type: {
            type: 'string',
            enum: ['threshold_cross', 'movement', 'divergence'],
            description: 'Type of alert: threshold_cross (prob crosses value), movement (significant change), divergence (cross-platform spread)',
          },
          condition: {
            type: 'object',
            description: 'Alert condition. For threshold_cross: {threshold: 0.5, direction: "above"|"below"}. For movement: {change_percent: 5}. For divergence: {spread_threshold: 0.05}.',
          },
        },
        required: ['event_id', 'alert_type'],
      },
    },
  },
]
