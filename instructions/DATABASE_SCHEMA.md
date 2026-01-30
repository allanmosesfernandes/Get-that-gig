# Database Schema

## Overview

All tables are in Supabase (Postgres). Row Level Security (RLS) is enabled on all tables.

## Tables

### users

Synced from Clerk via webhook. Do not create users directly.

```sql
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

-- RLS Policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt()->>'sub');

CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');
```

### cvs

Master CV storage with parsed content.

```sql
CREATE TABLE cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_file_url TEXT, -- Supabase storage path
  original_filename TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'docx')),
  parsed_content JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cvs_user_id ON cvs(user_id);

-- RLS Policy
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own CVs" ON cvs
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );
```

**parsed_content JSONB structure:**
```json
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string"
  },
  "summary": "string",
  "experience": [
    {
      "id": "uuid",
      "company": "string",
      "title": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string | null",
      "current": "boolean",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "id": "uuid",
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string | null"
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "id": "uuid",
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string | null"
    }
  ]
}
```

### applications

Job application tracking.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  job_url TEXT,
  job_description TEXT,
  tailored_cv_url TEXT, -- Supabase storage path for generated PDF
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offered', 'rejected', 'ghosted', 'withdrawn')),
  applied_at DATE DEFAULT CURRENT_DATE,
  salary_range TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at);

-- RLS Policy
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own applications" ON applications
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );
```

### ai_suggestions

Logs AI suggestions for analytics and debugging.

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_cv_snapshot JSONB, -- Snapshot of CV at suggestion time
  job_description TEXT,
  suggestions JSONB NOT NULL, -- Array of suggested changes
  accepted_suggestions JSONB DEFAULT '[]',
  rejected_suggestions JSONB DEFAULT '[]',
  tokens_used INTEGER,
  model_version TEXT DEFAULT 'gemini-1.5-pro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_created_at ON ai_suggestions(created_at);

-- RLS Policy
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own suggestions" ON ai_suggestions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );
```

**suggestions JSONB structure:**
```json
[
  {
    "id": "uuid",
    "type": "modify | add | remove",
    "section": "experience | skills | summary | education",
    "target": "string (what to change)",
    "original": "string | null",
    "suggested": "string",
    "reasoning": "string (why this change helps)",
    "confidence": "number (0-1)"
  }
]
```

### daily_stats

For positive reinforcement system.

```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  applications_count INTEGER DEFAULT 0,
  ai_sessions_count INTEGER DEFAULT 0,
  encouragement_shown BOOLEAN DEFAULT false,
  break_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date);

-- RLS Policy
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own stats" ON daily_stats
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );
```

## Storage Buckets

### cv-uploads

For original CV files (PDF/DOCX).

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);

-- RLS policies
CREATE POLICY "Users can upload own CVs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cv-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can read own CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can delete own CVs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cv-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );
```

**File path pattern:** `{clerk_user_id}/{cv_id}/{filename}`

### tailored-cvs

For AI-generated tailored CVs (PDF).

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('tailored-cvs', 'tailored-cvs', false);

-- Same RLS pattern as cv-uploads
```

**File path pattern:** `{clerk_user_id}/{application_id}/tailored-cv.pdf`

## Migrations

Run migrations in order:

1. `001_create_users.sql`
2. `002_create_cvs.sql`
3. `003_create_applications.sql`
4. `004_create_ai_suggestions.sql`
5. `005_create_daily_stats.sql`
6. `006_create_storage_buckets.sql`

## Helper Functions

### Update timestamp trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Increment daily stats

```sql
CREATE OR REPLACE FUNCTION increment_daily_applications(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, applications_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET applications_count = daily_stats.applications_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
