# Setup Guide - Sprint 1

This guide will help you set up the Get That Gig application locally.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Clerk account (free tier available)
- A Supabase account (free tier available)

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a new account
2. Create a new application
3. Enable the following sign-in methods:
   - Email
   - Google (optional)
4. Copy your API keys from the Clerk Dashboard
5. Go to **Webhooks** in the Clerk Dashboard and create a new webhook endpoint (you'll configure this after deployment)

## 3. Set Up Supabase

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Copy your project URL and keys from Settings → API

### Run Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following migration to create the users table:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt()->>'sub');

CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
```

### Generate TypeScript Types (Optional)

To generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

You can find your project ID in your Supabase project settings.

## 4. Configure Environment Variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # From Clerk Dashboard
CLERK_SECRET_KEY=sk_test_xxxxx                   # From Clerk Dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # From Supabase Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx                 # From Supabase Settings → API (anon/public key)
SUPABASE_SERVICE_ROLE_KEY=xxxxx                     # From Supabase Settings → API (service_role key - keep secret!)

# Clerk Webhook (configure after setting up webhook endpoint)
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

## 5. Run Development Server

**IMPORTANT**: You must configure your environment variables with valid Clerk and Supabase credentials before running the development server or building the application.

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

**Note**: The `npm run build` command requires valid Clerk credentials because Next.js validates the publishable key format at build time. Make sure you've set up Clerk and Supabase before attempting to build.

## 6. Configure Clerk Webhook

For local development, you'll need to expose your local server to the internet so Clerk can send webhooks.

### Using ngrok (Recommended for local testing)

1. Install ngrok: `brew install ngrok` (macOS) or download from [ngrok.com](https://ngrok.com)
2. Run ngrok: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. In Clerk Dashboard, go to **Webhooks** → **Add Endpoint**
5. Enter the webhook URL: `https://abc123.ngrok.io/api/webhooks/clerk`
6. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Copy the webhook signing secret
8. Add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`
9. Restart your dev server

### For Production

When deploying to production (Vercel, etc.):

1. Use your production URL: `https://yourdomain.com/api/webhooks/clerk`
2. Configure the webhook in Clerk Dashboard with the production URL
3. Add the webhook secret to your production environment variables

## 7. Test the Setup

1. Visit `http://localhost:3000`
2. Click "Get Started" to sign up
3. Create an account with email or Google
4. After signing up, you should be redirected to the dashboard
5. Check your Supabase database - you should see a new row in the `users` table

## Testing Checklist

- [ ] Sign up with email → Account created, redirected to dashboard
- [ ] Sign up with Google → OAuth flow completes, redirected to dashboard
- [ ] User synced to Supabase → Check users table has clerk_id
- [ ] Sign in → Redirected to dashboard
- [ ] Protected routes → Access /dashboard/cv without auth redirects to sign-in
- [ ] Sign out → Redirected to landing page
- [ ] Dashboard navigation → Each nav item loads, active state works
- [ ] Mobile sidebar → Resizes correctly, toggles on hamburger click

## Troubleshooting

### Webhook not working

- Verify ngrok is running and the URL matches in Clerk Dashboard
- Check that `CLERK_WEBHOOK_SECRET` is correctly set in `.env.local`
- Restart your dev server after adding the webhook secret
- Check the Clerk Dashboard webhook logs for errors

### User not syncing to Supabase

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not the anon key)
- Check the users table was created correctly
- Look at the webhook logs in Clerk Dashboard
- Check your server console for error messages

### Authentication redirect loop

- Clear your browser cookies for localhost:3000
- Verify environment variables are set correctly
- Check that middleware.ts is configured properly

### TypeScript errors

- Run `npm install` to ensure all dependencies are installed
- Restart your IDE/editor
- Check that you're using TypeScript 5.0+

## Next Steps

Sprint 1 is now complete! You have:

- ✅ Working authentication with Clerk
- ✅ User data synced to Supabase
- ✅ Protected dashboard with navigation
- ✅ Mobile-responsive layout

Proceed to Sprint 2 to implement CV management features.
