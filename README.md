# Get That Gig

AI-powered job application assistant. Create tailored CVs, apply with confidence, and track your applications all in one place.

## 🚀 Quick Start

1. **Prerequisites**: Node.js 18+, Clerk account, Supabase account
2. **Install**: `npm install`
3. **Setup**: Follow [SETUP.md](./SETUP.md) to configure Clerk and Supabase
4. **Run**: `npm run dev`
5. **Visit**: http://localhost:3000

## 📋 Project Status

**Current Sprint**: Sprint 1 - Foundation ✅ COMPLETE

See [SPRINT-1-COMPLETE.md](./SPRINT-1-COMPLETE.md) for details.

**Next Sprint**: Sprint 2 - CV Builder

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── cv/             # CV management (Sprint 2)
│   │   ├── apply/          # Apply mode (Sprint 3)
│   │   ├── track/          # Application tracker (Sprint 4)
│   │   └── analytics/      # Analytics (Sprint 6)
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk/      # User sync webhook
│   ├── layout.tsx          # Root layout with ClerkProvider
│   └── page.tsx            # Landing page
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   └── ui/                 # shadcn/ui components
└── lib/
    ├── supabase/           # Supabase clients
    └── utils.ts            # Utility functions
```

## 🔧 Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production (requires valid credentials)
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Check TypeScript errors
```

## 🌟 Features (Planned)

### Sprint 1: Foundation ✅
- User authentication (Clerk)
- User database sync (Supabase)
- Protected dashboard
- Responsive navigation

### Sprint 2: CV Builder (Next)
- Upload and parse CVs
- Create CV templates
- Manage CV versions
- Generate PDFs

### Sprint 3: Apply Mode
- Parse job descriptions
- AI-powered CV tailoring
- Generate cover letters
- Quick apply workflow

### Sprint 4: Application Tracker
- Track applications
- Kanban board view
- Timeline view
- Stage management

### Sprint 5: AI Integrations
- Claude API integration
- OpenAI fallback
- Prompt engineering
- Response handling

### Sprint 6: Analytics & Polish
- Application insights
- Success metrics
- UI refinements
- Performance optimization

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Complete setup instructions
- [Sprint 1 Completion](./SPRINT-1-COMPLETE.md) - What's been built
- [Database Schema](./instructions/DATABASE_SCHEMA.md) - Database structure
- [Project Overview](./instructions/OVERVIEW.md) - Product requirements

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## 🤝 Contributing

This is a learning project following a sprint-based development approach. Each sprint builds on the previous one.

## 📝 License

MIT

## 🆘 Support

Having issues? Check:
1. [SETUP.md](./SETUP.md) for setup instructions
2. [SPRINT-1-COMPLETE.md](./SPRINT-1-COMPLETE.md) for testing checklist
3. Browser console for client-side errors
4. Terminal output for server-side errors
5. Clerk Dashboard webhook logs
6. Supabase project logs

---

Built with Next.js, TypeScript, and AI assistance.
