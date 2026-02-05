# Get That Gig - Project Overview

> **Purpose:** This document provides LLM agents with essential context to work on this codebase effectively.

## What Is This?

**Get That Gig** is a B2C SaaS application that helps job seekers:
1. Tailor their CV/resume to specific job descriptions using AI
2. Track job applications in one place
3. Stay motivated during the job search with positive reinforcement

## The Problem We Solve

Job seekers typically:
- Send the same generic CV to every job (low response rates)
- Manually tweak CVs for each application (time-consuming)
- Lose track of where they applied
- Get discouraged by rejections and ghosting

## Core Value Proposition

**"Paste a job description, get a tailored CV in 60 seconds."**

The AI analyzes the job description against the user's master CV and suggests specific changes (keywords, rephrasing, reordering) to increase match rate. Users accept/reject suggestions and download a tailored PDF.

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 14+ (App Router) | Full-stack React, great DX |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development |
| Auth | Clerk | Managed auth, easy setup |
| Database | Supabase (Postgres) | Managed Postgres + Storage |
| AI | Google Gemini 1.5 Pro | Good quality, cost-effective |
| Payments | Stripe | Industry standard |
| Hosting | Vercel | Seamless Next.js deployment |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js App Router (React Server Components + Client)      │
├─────────────────────────────────────────────────────────────┤
│                      API Routes                              │
│  /api/cv/*  /api/ai/*  /api/applications/*  /api/webhooks/* │
├──────────────────┬──────────────────┬───────────────────────┤
│     Clerk        │    Supabase      │      Gemini AI        │
│  (Auth + Users)  │  (DB + Storage)  │   (CV Suggestions)    │
└──────────────────┴──────────────────┴───────────────────────┘
```

## Key User Flows

### 1. Apply Mode (Primary Flow)
```
User uploads CV → User pastes job description → AI generates suggestions
→ User accepts/rejects → Download tailored PDF → Log application
```

### 2. Application Tracking
```
Applications logged from Apply Mode (or manually) → Update status
→ View analytics → Export CSV
```

## Data Model (Simplified)

```
users (synced from Clerk)
  └── cvs (master CVs, parsed as JSON)
        └── applications (job applications)
              └── ai_suggestions (logged for analytics)
  └── daily_stats (for reinforcement system)
```

## Business Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | £0 | 1 CV, 5 AI sessions/month, 20 applications |
| Pro | £19/month | Unlimited CVs, unlimited AI, full analytics |

**Target:** 100 Pro subscribers = £2000/month revenue

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Sign-in, sign-up pages
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── cv/            # CV management
│   │   ├── apply/         # Apply mode (core feature)
│   │   ├── track/         # Application tracker
│   │   └── analytics/     # Stats dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Utilities and clients
│   ├── supabase/         # Database client
│   ├── gemini.ts         # AI client
│   └── cv-parser.ts      # PDF/DOCX parsing
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Clerk auth protection |
| `lib/supabase/server.ts` | Server-side DB client |
| `lib/gemini.ts` | Gemini AI wrapper |
| `app/api/ai/suggest/route.ts` | Core AI suggestion endpoint |
| `app/(dashboard)/apply/page.tsx` | Main apply mode UI |

## Environment Variables

```env
# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Gemini)
GEMINI_API_KEY=

# Payments (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Key Decisions

1. **Supabase over AWS** - Speed to market; learn AWS later
2. **Gemini over Claude/GPT** - 2.4x cheaper, good enough quality
3. **PDF-only output** - Simpler than supporting DOCX generation
4. **Clerk over NextAuth** - Managed auth, less maintenance
5. **shadcn/ui over MUI/Chakra** - Customizable, no runtime CSS-in-JS

## What Makes This Different

| Competitor | Gap We Fill |
|------------|-------------|
| Teal, Rezi | We focus on tailoring, not just building CVs |
| Resume.io | We have integrated application tracking |
| Spreadsheets | We automate the tedious parts |
| Generic | Mental health angle (positive reinforcement) |

## Sprint Roadmap

1. **Foundation** - Auth, dashboard shell
2. **CV Management** - Upload, parse, edit CVs
3. **Apply Mode** - AI suggestions, visual diff, PDF generation
4. **Tracker** - Application CRUD, status management
5. **Payments** - Stripe subscriptions, usage limits
6. **Polish** - Analytics, reinforcement system, landing page

## For LLM Agents: Quick Reference

### When working on this codebase:

- **Read** `instructions/DATABASE_SCHEMA.md` for all table structures
- **Read** `instructions/API_CONTRACTS.md` for endpoint specifications
- **Read** the relevant `instructions/sprints/sprint-*.md` for task details
- **Use** shadcn/ui components from `components/ui/`
- **Follow** existing patterns in the codebase
- **Don't** add features not in the current sprint
- **Don't** over-engineer or add unnecessary abstractions

### Common tasks:

| Task | Key Files |
|------|-----------|
| Add API endpoint | `app/api/[route]/route.ts` |
| Add dashboard page | `app/(dashboard)/[page]/page.tsx` |
| Add component | `components/[feature]/[name].tsx` |
| Database query | Use `lib/supabase/server.ts` |
| AI call | Use `lib/gemini.ts` |
| Auth check | Use `auth()` from `@clerk/nextjs/server` |

### Conventions:

- API responses: `{ success: true, data: {} }` or `{ success: false, error: { code, message } }`
- File naming: kebab-case for files, PascalCase for components
- Imports: Use `@/` alias for src directory
- Types: Define in `types/` directory, import as needed

---

## Recent Changes Log

### Master CV Edit Flow Improvements (Latest)

**Date:** 2026-02-05

**Changes Made:**
1. **CVEditor Component** (`src/components/cv/cv-editor.tsx`):
   - Removed auto-save (debounced save) behavior
   - Added explicit "Save Changes" button with confirmation dialog
   - Added "Unsaved changes" indicator when form is dirty
   - Added sticky footer with Cancel/Save buttons
   - Added confirmation dialog: "Update Master CV?" warning users this affects AI-tailored applications
   - Added discard confirmation when canceling with unsaved changes
   - New prop: `onCancel: () => void` to exit edit mode

2. **CV Page** (`src/app/dashboard/cv/page.tsx`):
   - Changed "Edit" button to "Edit Profile"
   - Header buttons (Edit, Re-upload, Delete) only show in view mode
   - In edit mode, editor has its own Cancel button to exit

3. **CV Detail Page** (`src/app/dashboard/cv/[id]/page.tsx`):
   - Added controlled tab state for view/edit switching
   - Updated CVEditor call with `onCancel` prop

4. **PDF Viewer** (`src/components/cv/pdf-viewer.tsx`):
   - Changed label from "Original Document" to "Uploaded CV"

**UI Flow:**
```
┌─────────────────────────────────────────────┐
│ [Edit form fields...]                        │
│                                              │
├─────────────────────────────────────────────┤
│ ⚠ Unsaved changes    [Cancel] [Save Changes]│  <- Sticky footer
└─────────────────────────────────────────────┘
```

---

## Resume Instructions

**Current State:** Sprint 3 (Apply Mode) in progress

**Dev Server:** Running on `http://localhost:3010`

**To Resume Development:**
1. Open terminal in project root
2. Run `npm run dev` (if server not running)
3. Test the CV edit flow at `/dashboard/cv`

**Next Steps:**
- Test the explicit save flow thoroughly
- Continue with remaining Sprint 3 tasks (Apply Mode features)
- Review `instructions/sprints/sprint-3-apply-mode.md` for task list
