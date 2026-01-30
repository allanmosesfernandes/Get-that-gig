# Sprint 1: Foundation

**Duration:** 3-4 days
**Goal:** Working authentication and dashboard shell

## Deliverables

1. Next.js 14 project with TypeScript, Tailwind, shadcn/ui
2. Clerk authentication (sign-in, sign-up, protected routes)
3. Supabase project with users table
4. Clerk webhook to sync users
5. Dashboard layout with navigation

## PRD

### User Stories

**US-1.1: New User Registration**
> As a new user, I want to sign up with email or Google so I can start using the app.

Acceptance Criteria:
- User can sign up with email/password
- User can sign up with Google OAuth
- After sign-up, user is redirected to dashboard
- User record is created in Supabase

**US-1.2: User Sign In**
> As a returning user, I want to sign in to access my dashboard.

Acceptance Criteria:
- User can sign in with email/password
- User can sign in with Google
- "Forgot password" flow works
- After sign-in, user sees dashboard

**US-1.3: Dashboard Navigation**
> As a user, I want to navigate between different sections of the app.

Acceptance Criteria:
- Sidebar shows: Overview, CVs, Apply, Track, Analytics
- Current page is highlighted in nav
- User avatar/menu in header with sign out option
- Mobile-responsive (collapsible sidebar)

## Technical Specification

### Project Setup

```bash
npx create-next-app@latest get-that-gig --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd get-that-gig
npx shadcn@latest init
```

shadcn config:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Directory Structure (Sprint 1)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Overview
│   │   ├── cv/page.tsx       # Placeholder
│   │   ├── apply/page.tsx    # Placeholder
│   │   ├── track/page.tsx    # Placeholder
│   │   └── analytics/page.tsx # Placeholder
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk/route.ts
│   ├── layout.tsx
│   └── page.tsx              # Landing (redirect to dashboard if auth)
├── components/
│   ├── ui/                   # shadcn components
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── nav-item.tsx
│   └── providers.tsx         # ClerkProvider wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   └── utils.ts              # cn() helper
├── types/
│   └── database.ts           # Supabase types
└── middleware.ts             # Clerk auth middleware
```

### Packages to Install

```bash
# Auth
npm install @clerk/nextjs

# Database
npm install @supabase/supabase-js

# UI Components (via shadcn CLI)
npx shadcn@latest add button card avatar dropdown-menu separator

# Icons
npm install lucide-react

# Webhook verification
npm install svix
```

### Clerk Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### Supabase Setup

1. Create project at supabase.com
2. Run migration for users table (see DATABASE_SCHEMA.md)
3. Get API keys for environment variables

### Clerk Webhook Handler

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = await createClient()

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    await supabase.from('users').insert({
      clerk_id: id,
      email: email_addresses[0]?.email_address,
      full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
    })
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data
    await supabase.from('users').update({
      email: email_addresses[0]?.email_address,
      full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
    }).eq('clerk_id', id)
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data
    if (id) {
      await supabase.from('users').delete().eq('clerk_id', id)
    }
  }

  return new Response('OK', { status: 200 })
}
```

## Tasks

### Setup (Day 1)

- [ ] Create Next.js project with TypeScript and Tailwind
- [ ] Initialize shadcn/ui with default config
- [ ] Add shadcn components: button, card, avatar, dropdown-menu, separator
- [ ] Install lucide-react for icons
- [ ] Create project structure (directories)
- [ ] Set up environment variables template (.env.example)

### Authentication (Day 2)

- [ ] Create Clerk account and application
- [ ] Install @clerk/nextjs
- [ ] Configure ClerkProvider in root layout
- [ ] Create middleware.ts for route protection
- [ ] Create sign-in page with Clerk's SignIn component
- [ ] Create sign-up page with Clerk's SignUp component
- [ ] Test auth flow end-to-end

### Supabase (Day 2-3)

- [ ] Create Supabase project
- [ ] Run users table migration
- [ ] Install @supabase/supabase-js
- [ ] Create lib/supabase/client.ts (browser client)
- [ ] Create lib/supabase/server.ts (server client with service role)
- [ ] Generate TypeScript types from Supabase

### Webhook (Day 3)

- [ ] Install svix for webhook verification
- [ ] Create POST /api/webhooks/clerk/route.ts
- [ ] Configure Clerk webhook in dashboard (user.created, user.updated, user.deleted)
- [ ] Test user sync: sign up → check Supabase
- [ ] Expose local webhook with ngrok for testing

### Dashboard (Day 3-4)

- [ ] Create dashboard layout with sidebar
- [ ] Create header component with user menu
- [ ] Create navigation items component
- [ ] Add placeholder pages for: Overview, CVs, Apply, Track, Analytics
- [ ] Implement mobile-responsive sidebar (collapsible)
- [ ] Style active nav state
- [ ] Add sign out functionality

## Testing

### Manual Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Sign up with email | Go to /sign-up, enter email/password | Account created, redirected to dashboard |
| Sign up with Google | Click Google button on sign-up | OAuth flow completes, redirected to dashboard |
| User synced to Supabase | Sign up new user | Row exists in users table with clerk_id |
| Sign in | Go to /sign-in, enter credentials | Redirected to dashboard |
| Protected routes | Access /cv without auth | Redirected to sign-in |
| Sign out | Click avatar → Sign out | Redirected to landing or sign-in |
| Dashboard navigation | Click each nav item | Correct page loads, nav item highlighted |
| Mobile sidebar | Resize to mobile, click hamburger | Sidebar toggles |

### Integration Tests (Optional)

```typescript
// __tests__/webhook.test.ts
import { POST } from '@/app/api/webhooks/clerk/route'

describe('Clerk Webhook', () => {
  it('creates user on user.created event', async () => {
    // Mock svix verification
    // Mock Supabase insert
    // Assert user created
  })
})
```

## Definition of Done

- [ ] User can sign up with email or Google
- [ ] User can sign in and see dashboard
- [ ] New users are synced to Supabase via webhook
- [ ] Dashboard has working navigation to all sections
- [ ] Protected routes redirect to sign-in when unauthenticated
- [ ] Mobile-responsive sidebar works
- [ ] All environment variables documented
- [ ] No TypeScript errors
- [ ] No console errors in browser

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Notes for LLM Agents

- Use `@clerk/nextjs` v5+ which uses `clerkMiddleware` (not `authMiddleware`)
- Supabase server client needs service role key for webhook operations
- Clerk webhook must be configured in Clerk Dashboard → Webhooks
- Use ngrok or similar for local webhook testing
- shadcn components are copied to your codebase, not imported from a package
