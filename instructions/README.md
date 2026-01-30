# Get That Gig - Implementation Instructions

This directory contains structured implementation guides for LLM agents building the Get That Gig SaaS application.

## Project Overview

A job application assistant that helps users:
- Tailor CVs to job descriptions using AI
- Track job applications
- Maintain mental wellness during job hunting

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| UI | React + Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (Postgres + Storage) |
| AI | Google Gemini 1.5 Pro |
| Payments | Stripe |
| Deployment | Vercel |

## Sprint Overview

| Sprint | Focus | Duration | Key Deliverable |
|--------|-------|----------|-----------------|
| [Sprint 1](./sprints/sprint-1-foundation.md) | Foundation | 3-4 days | Working auth + dashboard shell |
| [Sprint 2](./sprints/sprint-2-cv-management.md) | CV Management | 4-5 days | Upload, parse, display CVs |
| [Sprint 3](./sprints/sprint-3-apply-mode.md) | Apply Mode (Core) | 5-6 days | AI-powered CV tailoring |
| [Sprint 4](./sprints/sprint-4-tracker.md) | Application Tracker | 3-4 days | Full CRUD tracker |
| [Sprint 5](./sprints/sprint-5-payments.md) | Monetization | 3-4 days | Stripe subscriptions |
| [Sprint 6](./sprints/sprint-6-polish.md) | Polish & Launch | 4-5 days | Landing page, analytics, reinforcement |

## Directory Structure

```
instructions/
├── README.md                 # This file
├── DATABASE_SCHEMA.md        # Complete database schema
├── API_CONTRACTS.md          # API endpoint specifications
├── sprints/
│   ├── sprint-1-foundation.md
│   ├── sprint-2-cv-management.md
│   ├── sprint-3-apply-mode.md
│   ├── sprint-4-tracker.md
│   ├── sprint-5-payments.md
│   └── sprint-6-polish.md
```

## How to Use These Instructions

### For LLM Agents

1. **Start with the current sprint document** - Each sprint has clear acceptance criteria
2. **Reference DATABASE_SCHEMA.md** for all database operations
3. **Reference API_CONTRACTS.md** for endpoint specifications
4. **Complete all tests** before marking a sprint done
5. **Do not skip ahead** - Sprints build on each other

### Sprint Document Structure

Each sprint contains:
- **Goal**: What we're building
- **PRD**: Product requirements with user stories
- **Technical Spec**: Implementation details
- **Tasks**: Ordered checklist
- **Testing**: Manual and automated test criteria
- **Definition of Done**: Clear completion criteria

## Key Decisions

- **Supabase over AWS**: Speed to market priority
- **Gemini 1.5 Pro**: 2.4x cheaper than Claude, good quality
- **PDF-only output**: Simpler, universally accepted
- **shadcn/ui**: Accessible, customizable components

## Environment Variables Required

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```
