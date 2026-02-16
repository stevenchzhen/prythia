# Week 3-4 Dev Plan: Auth, Dashboard Features & AI Chat

## Context

Week 3 delivered the core data pipeline and the three primary views (Feed, Event Detail, Watchlist). The dashboard shell has 5 stub pages (Explore, Chat, Alerts, Analytics, Settings) and no authentication. This plan fills in Google OAuth, all stub pages, and wires the existing AI infrastructure into a working chat experience.

**Bug fix included**: Watchlist `useSyncExternalStore` infinite re-render (already fixed before this plan).

---

## Implementation Plan (8 steps)

### Step 1: Google OAuth — Login/Signup/Callback

**Why**: No auth exists; users can't log in. Supabase clients and middleware are already wired up — just need the UI and callback handler.

**Approach**: Use Supabase's built-in Google OAuth provider (no NextAuth needed). Supabase handles the OAuth flow; we just need a button that calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.

**Files**:
- `src/app/(auth)/login/page.tsx` — Rewrite: Google sign-in button + email/password form, dark theme matching dashboard
- `src/app/(auth)/signup/page.tsx` — Rewrite: Same as login but with "Create account" framing (or redirect to login since OAuth handles both)
- `src/app/(auth)/callback/route.ts` — Uncomment: Exchange code for session, redirect to `/feed`
- `src/lib/supabase/middleware.ts` — Re-enable auth wall for protected paths
- `src/components/dashboard/sidebar.tsx` — Add user avatar/email at bottom, sign-out button
- `.env.example` — No changes needed (Google OAuth is configured in Supabase dashboard, not env vars)

**Login page design**:
- Centered card, dark bg matching app theme (`#050506`)
- Prythia logo + "Signal Intelligence" tagline
- "Continue with Google" button (primary, golden accent)
- Divider "or"
- Email + password fields (for future email auth)
- Link to signup / link to login (toggle between pages)

### Step 2: Explore Page — Category Overview

**Why**: Users need to browse events by category with visual overview.

**Files**:
- `src/app/(dashboard)/explore/page.tsx` — Rewrite: Category grid with stats
- `src/app/api/v1/categories/[slug]/route.ts` — Check if implemented; enhance if needed

**Design**:
- Header: "Explore Categories"
- Grid of category cards (2-3 columns), each showing:
  - Category name + icon
  - Event count
  - Top mover in category (event title + change badge)
  - Average likelihood across category
- Click card → navigate to `/feed?category={slug}` (reuses existing feed filtering)
- Fetch category data via a new lightweight API or aggregate client-side from events

### Step 3: AI Chat Page — Wire to RAG Pipeline

**Why**: The full AI infrastructure exists (`src/lib/ai/` — client, RAG pipeline, prompts, tools, post-processor) but the API endpoint is a stub and the chat UI doesn't send messages.

**Files**:
- `src/app/api/v1/ai/query/route.ts` — Rewrite: Call `runRAGPipeline`, return streamed or JSON response
- `src/app/(dashboard)/chat/page.tsx` — Rewrite: Wire `AIChat` component
- `src/components/ai/ai-chat.tsx` — Rewrite: Send messages to `/api/v1/ai/query`, display responses, show loading state
- Reuse existing: `SuggestedPrompts`, `AIDataCard`, `src/lib/ai/rag.ts`, `src/lib/ai/client.ts`

**Chat flow**:
1. User types question → POST to `/api/v1/ai/query` with `{ question, context }`
2. API route calls `runRAGPipeline(query)` from `src/lib/ai/rag.ts`
3. Returns `{ answer, events_referenced, confidence }`
4. Display response in chat with AI branding
5. Show referenced events as clickable cards

**Note**: No auth required for AI chat initially (no conversation persistence). Add DB persistence later when auth is stable.

### Step 4: Alerts Page — Create & Manage Alerts

**Why**: Users need notification rules for probability changes. DB schema exists (`alerts`, `alert_history` tables). Components exist (`AlertList`, `AlertForm` stub, `AlertPreview`).

**Files**:
- `src/app/(dashboard)/alerts/page.tsx` — Rewrite: List alerts + create form
- `src/components/alerts/alert-form.tsx` — Rewrite: Full form with event picker, condition type, threshold, channels
- `src/app/api/v1/alerts/route.ts` — New: CRUD for user's alerts (requires auth)

**Design**:
- Header: "Alerts & Notifications" + "Create Alert" button
- Alert list showing existing alerts with toggle switch (reuse `AlertList` component)
- Create alert sheet/modal:
  - Event search/picker (search existing events)
  - Alert type: Likelihood crosses threshold, Large movement (%), New event in category
  - Threshold value input
  - Frequency: Real-time, Hourly, Daily digest
  - Channel: In-app (only option for now, email later)
- Empty state: "No alerts yet. Create one to get notified when market signals change."

**Note**: Alerts page requires auth (user_id for DB). If not logged in, show prompt to sign in.

### Step 5: Settings Page — User Preferences

**Why**: Users need to control display density, notification preferences, and see account info.

**Files**:
- `src/app/(dashboard)/settings/page.tsx` — Rewrite: Settings form
- `src/app/api/v1/settings/route.ts` — New: GET/PUT user preferences

**Design sections**:
- **Account**: Email (read-only from auth), sign-out button
- **Display**: Density toggle (compact/default/expanded), default category dropdown
- **Notifications**: Email alerts toggle, email digest toggle, digest time picker, quiet hours
- **Data**: Export (link to export endpoint, future)

**Note**: Settings requires auth. Use `user_preferences` table. Create default prefs row on first visit.

### Step 6: Analytics Page — Platform Comparison & Stats

**Why**: Users want to see how different prediction market platforms compare. Full calibration tracking requires resolved events (v1), but we can show platform stats now.

**Files**:
- `src/app/(dashboard)/analytics/page.tsx` — Rewrite: Platform comparison + category stats

**Design**:
- Header: "Analytics & Accuracy"
- **Platform Comparison** card: Table showing Polymarket vs Kalshi vs Metaculus with:
  - Number of active contracts
  - Average volume
  - Coverage by category
  - Sourced from existing `source_contracts` data
- **Category Distribution** card: Bar chart showing event count per category
- **Resolution Tracking** placeholder: "Accuracy tracking will be available once events begin resolving" (keep existing messaging)
- All data derived from existing events + source_contracts tables (no new API needed, fetch client-side)

### Step 7: Density Toggle — Wire to Preference

**Why**: The toggle exists in topbar but is non-functional.

**Files**:
- `src/components/dashboard/density-toggle.tsx` — Rewrite: cycle compact/default/expanded, persist to localStorage (or user_preferences if logged in)
- `src/components/events/event-row.tsx` — Accept density prop, adjust padding/spacing
- `src/hooks/use-density.ts` — New: localStorage-backed density state (similar pattern to watchlist)

### Step 8: Polish & Auth Integration

**Files**:
- `src/hooks/use-watchlist.ts` — When user is logged in, sync to DB (`watchlist_items` table) instead of localStorage
- `src/components/dashboard/sidebar.tsx` — Show user info at bottom when logged in, "Sign in" link when not

---

## Files Modified/Created Summary

| File | Action |
|------|--------|
| `src/app/(auth)/login/page.tsx` | Rewrite — Google OAuth + email form |
| `src/app/(auth)/signup/page.tsx` | Rewrite — redirect or duplicate login |
| `src/app/(auth)/callback/route.ts` | Rewrite — uncomment + fix |
| `src/lib/supabase/middleware.ts` | Edit — re-enable auth wall |
| `src/components/dashboard/sidebar.tsx` | Edit — add user info + sign out |
| `src/app/(dashboard)/explore/page.tsx` | Rewrite — category grid |
| `src/app/(dashboard)/chat/page.tsx` | Rewrite — wire AIChat |
| `src/components/ai/ai-chat.tsx` | Rewrite — functional chat |
| `src/app/api/v1/ai/query/route.ts` | Rewrite — call RAG pipeline |
| `src/app/(dashboard)/alerts/page.tsx` | Rewrite — alert list + create |
| `src/components/alerts/alert-form.tsx` | Rewrite — full form |
| `src/app/api/v1/alerts/route.ts` | New — CRUD alerts |
| `src/app/(dashboard)/settings/page.tsx` | Rewrite — preferences form |
| `src/app/api/v1/settings/route.ts` | New — GET/PUT preferences |
| `src/app/(dashboard)/analytics/page.tsx` | Rewrite — platform stats |
| `src/components/dashboard/density-toggle.tsx` | Rewrite — functional toggle |
| `src/hooks/use-density.ts` | New — density state hook |
| `src/components/events/event-row.tsx` | Edit — density-aware spacing |

**Reused as-is**: `SuggestedPrompts`, `AIDataCard`, `AlertList`, `AlertPreview`, `src/lib/ai/*` (RAG pipeline, client, prompts, tools, post-processor), `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, all existing event components

---

## Execution Order

1. **Google OAuth** (Step 1) — unblocks auth-dependent features
2. **Explore page** (Step 2) — quick win, no auth dependency
3. **AI Chat** (Step 3) — high-value feature, no auth needed
4. **Alerts** (Step 4) — requires auth
5. **Settings** (Step 5) — requires auth
6. **Analytics** (Step 6) — standalone
7. **Density toggle** (Step 7) — polish
8. **Auth integration for watchlist** (Step 8) — polish

---

## Verification

1. `pnpm lint` — 0 errors, 0 warnings
2. `pnpm tsc --noEmit` — no type errors
3. `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder pnpm build` — builds with placeholder env vars
4. Manual testing on `pnpm dev`:
   - `/login` shows Google sign-in button, clicking initiates OAuth flow
   - Auth callback redirects to `/feed`
   - Sidebar shows user email when logged in, sign-out works
   - `/explore` shows category grid, clicking navigates to filtered feed
   - `/chat` — type a question, get AI response with referenced events
   - `/alerts` — create alert with event picker and threshold
   - `/settings` — update preferences, see them persist
   - `/analytics` — see platform comparison table and category distribution
   - Density toggle cycles through compact/default/expanded
