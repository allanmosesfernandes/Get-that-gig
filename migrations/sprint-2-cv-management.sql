-- Sprint 2: CV Management Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE CVS TABLE
-- ============================================

CREATE TABLE cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_file_url TEXT,
  original_filename TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'docx')),
  parsed_content JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX idx_cvs_user_id ON cvs(user_id);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access for API routes)
CREATE POLICY "Service role full access" ON cvs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 3. STORAGE POLICY (for cv-uploads bucket)
-- ============================================
-- NOTE: First create the bucket manually in Supabase Dashboard:
--   1. Go to Storage
--   2. Click "New bucket"
--   3. Name: cv-uploads
--   4. Set to Private
--   5. Click "Create bucket"
-- Then run this policy:

CREATE POLICY "Service role can manage cv uploads"
ON storage.objects FOR ALL
USING (bucket_id = 'cv-uploads' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'cv-uploads' AND auth.role() = 'service_role');
