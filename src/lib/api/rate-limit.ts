import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const rateLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'rl:free',
  }),
  starter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    prefix: 'rl:starter',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3000, '1 m'),
    prefix: 'rl:pro',
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100000, '1 m'),
    prefix: 'rl:enterprise',
  }),
}

export async function rateLimit(identifier: string, tier: string = 'free') {
  const limiter =
    rateLimiters[tier as keyof typeof rateLimiters] || rateLimiters.free
  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  }
}
