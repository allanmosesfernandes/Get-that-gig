-- Sprint 3: Apply Mode Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE APPLICATIONS TABLE
-- ============================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  tailored_cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  job_url TEXT,
  job_description TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  tailored_cv_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- ============================================
-- 2. CREATE AI_SUGGESTIONS TABLE
-- ============================================

CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  job_url TEXT,
  suggestions JSONB NOT NULL DEFAULT '[]',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);

-- ============================================
-- 3. CREATE DAILY_STATS TABLE
-- ============================================

CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_sessions_used INTEGER DEFAULT 0,
  applications_submitted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index for user and date lookups
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies for service role (full access for API routes)
CREATE POLICY "Service role full access" ON applications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON ai_suggestions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON daily_stats
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 5. FUNCTION: INCREMENT DAILY AI SESSIONS
-- ============================================

CREATE OR REPLACE FUNCTION increment_daily_ai_sessions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_sessions INTEGER;
BEGIN
  -- Insert or update daily stats
  INSERT INTO daily_stats (user_id, date, ai_sessions_used)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    ai_sessions_used = daily_stats.ai_sessions_used + 1,
    updated_at = NOW()
  RETURNING ai_sessions_used INTO v_sessions;

  RETURN v_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNCTION: GET MONTHLY AI SESSIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_monthly_ai_sessions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(ai_sessions_used), 0)
  INTO v_total
  FROM daily_stats
  WHERE user_id = p_user_id
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. STORAGE POLICY (for tailored-cvs bucket)
-- ============================================
-- NOTE: First create the bucket manually in Supabase Dashboard:
--   1. Go to Storage
--   2. Click "New bucket"
--   3. Name: tailored-cvs
--   4. Set to Private
--   5. Click "Create bucket"
-- Then run this policy:

CREATE POLICY "Service role can manage tailored cvs"
ON storage.objects FOR ALL
USING (bucket_id = 'tailored-cvs' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'tailored-cvs' AND auth.role() = 'service_role');

-- ============================================
-- 8. UPDATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
