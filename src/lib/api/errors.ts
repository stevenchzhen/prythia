import { NextResponse } from 'next/server'

interface ErrorResponseOptions {
  status: number
  code: string
  message: string
  details?: unknown
  headers?: Record<string, string>
}

export function errorResponse({
  status,
  code,
  message,
  details,
  headers,
}: ErrorResponseOptions) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status, headers }
  )
}

// Common error factories
export const errors = {
  unauthorized: (message = 'Unauthorized') =>
    errorResponse({ status: 401, code: 'UNAUTHORIZED', message }),

  forbidden: (message = 'Forbidden') =>
    errorResponse({ status: 403, code: 'FORBIDDEN', message }),

  notFound: (resource = 'Resource') =>
    errorResponse({ status: 404, code: 'NOT_FOUND', message: `${resource} not found` }),

  rateLimited: (headers: Record<string, string>) =>
    errorResponse({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Please slow down.',
      headers,
    }),

  badRequest: (message: string, details?: unknown) =>
    errorResponse({ status: 400, code: 'BAD_REQUEST', message, details }),

  internal: (message = 'Internal server error') =>
    errorResponse({ status: 500, code: 'INTERNAL_ERROR', message }),
}
