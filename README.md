# Prythia — Prediction Market Intelligence Platform

Aggregated prediction market data, AI analysis, and alerts across Polymarket, Kalshi, and Metaculus. Two products, one data layer: a **Dashboard** for analysts and operations teams, and an **API** for quant funds and data partners.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend & API | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| UI Components | shadcn/ui, Recharts, cmdk |
| Database | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Cache / Rate Limit | Upstash Redis |
| AI Inference | DeepSeek API (v0) / RunPod + vLLM (v1) |
| Email | Resend (React Email templates) |
| Hosting | Vercel (frontend + API + cron) |
| Monitoring | Sentry, Vercel Analytics |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for local Supabase)
- Supabase CLI (`pnpm dlx supabase`)

### Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/prythia.git
cd prythia
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase, Upstash, and API keys

# Start local Supabase (requires Docker)
npx supabase start

# Apply database migrations
npx supabase db push

# Seed development data
npx tsx scripts/seed-events.ts

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
prythia/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup, OAuth callback
│   │   ├── (dashboard)/        # Protected dashboard (8 screens)
│   │   │   ├── feed/           # Global Feed — default view
│   │   │   ├── event/[id]/     # Event Detail
│   │   │   ├── watchlist/      # Watchlist & Portfolio
│   │   │   ├── explore/        # Category Explorer
│   │   │   ├── chat/           # AI Chat Interface
│   │   │   ├── alerts/         # Alerts & Notifications
│   │   │   ├── analytics/      # Accuracy Dashboard (v1)
│   │   │   └── settings/       # Settings & API Keys
│   │   └── api/
│   │       ├── v1/             # Public REST API
│   │       ├── cron/           # Vercel Cron jobs (ingestion, alerts, AI)
│   │       └── internal/       # Internal webhooks
│   │
│   ├── components/             # React components by domain
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── dashboard/          # Shell (sidebar, topbar, command palette)
│   │   ├── events/             # Event row, card, chart, sparkline
│   │   ├── watchlist/          # Watchlist groups, summary
│   │   ├── ai/                 # AI chat, analysis block, data cards
│   │   ├── alerts/             # Alert form, list, preview
│   │   ├── filters/            # Filter panel, category tabs, sliders
│   │   └── charts/             # Treemap, calibration, volume charts
│   │
│   ├── lib/                    # Shared logic & service clients
│   │   ├── supabase/           # Browser, server, and admin clients
│   │   ├── api/                # Auth, rate limiting, errors, pagination
│   │   ├── ingestion/          # Polymarket, Kalshi, Metaculus scrapers
│   │   ├── ai/                 # Inference client, RAG pipeline, prompts
│   │   ├── notifications/      # Email, Slack, Discord, webhook delivery
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── constants.ts        # Taxonomy, thresholds, limits
│   │
│   ├── hooks/                  # Custom React hooks (SWR, realtime, shortcuts)
│   └── styles/                 # Design tokens for JS access
│
├── supabase/
│   ├── migrations/             # 6 SQL migration files (schema, RLS, indexes)
│   ├── seed.sql                # Development seed data
│   └── config.toml             # Local dev config
│
├── scripts/                    # One-off scripts (seed, backfill, test)
├── emails/                     # React Email templates (Resend)
├── vercel.json                 # Cron job schedules
├── middleware.ts                # Auth guard for dashboard routes
└── .env.example                # Environment variable template
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis token |
| `DEEPSEEK_API_KEY` | Yes (v0) | DeepSeek API key for AI features |
| `RESEND_API_KEY` | Yes | Resend API key for email alerts |
| `CRON_SECRET` | Yes | Secret to authenticate Vercel cron requests |

## API

Public API available at `/api/v1/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/events` | GET | List events with filters, sorting, pagination |
| `/api/v1/events/:id` | GET | Event detail with sources and AI analysis |
| `/api/v1/events/:id/history` | GET | Historical probability time series |
| `/api/v1/movers` | GET | Biggest movers by probability change |
| `/api/v1/categories/:slug` | GET | Category summary stats |
| `/api/v1/ai/query` | POST | AI-powered Q&A over prediction market data |
| `/api/v1/export` | GET | Bulk historical data export |

Authentication: `Authorization: Bearer pk_live_...`

## Cron Jobs

Configured in `vercel.json`, requires Vercel Pro for 5-minute intervals:

| Job | Schedule | Description |
|-----|----------|-------------|
| `/api/cron/ingest` | Every 5 min | Scrape Polymarket, Kalshi, Metaculus |
| `/api/cron/aggregate` | Every 5 min | Recalculate aggregated probabilities |
| `/api/cron/alerts` | Every 5 min | Check and fire user alerts |
| `/api/cron/ai-analysis` | Daily 6am UTC | Refresh AI analysis on events |
| `/api/cron/daily-digest` | Daily 2pm UTC | Send morning digest emails |

## Development

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm tsc --noEmit # Type check
```

## License

Proprietary. All rights reserved.
