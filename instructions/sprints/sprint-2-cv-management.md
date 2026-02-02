# Sprint 2: CV Management

**Duration:** 4-5 days
**Goal:** Users can upload, view, edit, and manage their CVs
**Prerequisites:** Sprint 1 complete (auth + dashboard working)

## Deliverables

1. CV upload (PDF and DOCX support)
<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

2. CV parsing to structured JSON
3. CV list view with primary selection
4. CV detail view with parsed sections
5. Basic CV editing
6. Original file download

## PRD

### User Stories

**US-2.1: Upload CV**
> As a user, I want to upload my CV (PDF or DOCX) so the app can analyze it.

Acceptance Criteria:
- Drag-and-drop or click-to-upload interface
- Supports PDF and DOCX files up to 5MB
- Shows upload progress
- Displays error for invalid files
- Free tier limited to 1 CV

**US-2.2: View Parsed CV**
> As a user, I want to see my CV content organized into sections so I can review what was extracted.

Acceptance Criteria:
- Displays: Contact, Summary, Experience, Education, Skills, Projects
- Each section is clearly labeled
- Shows original filename and upload date
- Can download original file

**US-2.3: Edit CV Content**
> As a user, I want to edit the parsed CV content to fix any parsing errors.

Acceptance Criteria:
- Can edit each section inline
- Changes save automatically (debounced)
- Can add/remove items in lists (skills, experience bullets)
- Visual feedback on save

**US-2.4: Manage Multiple CVs (Pro)**
> As a Pro user, I want to have multiple CVs for different job types.

Acceptance Criteria:
- Can upload multiple CVs
- Can set one as "primary"
- Can delete CVs
- List view shows all CVs with quick actions

**US-2.5: CV Parsing Fallback**
> As a user, if parsing fails, I want to manually enter my CV data.

Acceptance Criteria:
- If parsing fails, show empty template
- User can fill in sections manually
- Original file still stored for reference

## Technical Specification

### New Files

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── cv/
│   │       ├── page.tsx           # CV list
│   │       ├── upload/page.tsx    # Upload flow
│   │       └── [id]/
│   │           ├── page.tsx       # CV detail/edit
│   │           └── loading.tsx
│   └── api/
│       └── cv/
│           ├── route.ts           # GET list, POST create
│           ├── upload/route.ts    # POST file upload
│           ├── [id]/
│           │   ├── route.ts       # GET, PATCH, DELETE
│           │   └── download/route.ts
│           └── parse/route.ts     # POST parse uploaded file
├── components/
│   └── cv/
│       ├── cv-card.tsx            # Card for list view
│       ├── cv-upload-zone.tsx     # Drag-drop uploader
│       ├── cv-viewer.tsx          # Display parsed CV
│       ├── cv-editor.tsx          # Edit parsed CV
│       ├── section-editor.tsx     # Edit individual section
│       └── experience-item.tsx    # Experience entry component
├── lib/
│   ├── cv-parser.ts               # PDF/DOCX parsing logic
│   └── validators/
│       └── cv.ts                  # Zod schemas
└── types/
    └── cv.ts                      # CV type definitions
```

### Packages to Install

```bash
# PDF parsing
npm install pdf-parse
npm install @types/pdf-parse --save-dev

# DOCX parsing
npm install mammoth

# File upload handling
npm install @uploadthing/react uploadthing
# OR use Supabase Storage directly

# Form handling (for editor)
npm install react-hook-form @hookform/resolvers zod

# UI components
npx shadcn@latest add input textarea label form tabs dialog alert-description badge progress toast
```

### Type Definitions

```typescript
// types/cv.ts
export interface ContactInfo {
  name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  portfolio?: string
}

export interface ExperienceItem {
  id: string
  company: string
  title: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  bullets: string[]
}

export interface EducationItem {
  id: string
  institution: string
  degree: string
  field?: string
  startDate?: string
  endDate?: string
  gpa?: string
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  date?: string
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  technologies: string[]
  url?: string
}

export interface ParsedCV {
  contact: ContactInfo
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: string[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
}

export interface CV {
  id: string
  user_id: string
  title: string
  original_file_url: string | null
  original_filename: string | null
  file_type: 'pdf' | 'docx' | null
  parsed_content: ParsedCV
  is_primary: boolean
  created_at: string
  updated_at: string
}
```

### CV Parsing Logic

```typescript
// lib/cv-parser.ts
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function parseCV(
  buffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<ParsedCV> {
  // Extract raw text
  let rawText: string

  if (fileType === 'pdf') {
    const data = await pdf(buffer)
    rawText = data.text
  } else {
    const result = await mammoth.extractRawText({ buffer })
    rawText = result.value
  }

  // Use Gemini to structure the content
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `Parse this CV/resume text into structured JSON. Extract:
- contact: { name, email, phone, location, linkedin, portfolio }
- summary: string (professional summary or objective)
- experience: array of { company, title, location, startDate, endDate, current, bullets }
- education: array of { institution, degree, field, startDate, endDate, gpa }
- skills: array of strings
- certifications: array of { name, issuer, date }
- projects: array of { name, description, technologies, url }

If a field is not found, use null or empty array. Dates should be in "MMM YYYY" format.

CV Text:
${rawText}

Return ONLY valid JSON, no markdown formatting.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  // Clean and parse JSON
  const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim()
  const parsed = JSON.parse(jsonStr)

  // Add IDs to array items
  return {
    ...parsed,
    experience: parsed.experience?.map((e: any) => ({ ...e, id: crypto.randomUUID() })) || [],
    education: parsed.education?.map((e: any) => ({ ...e, id: crypto.randomUUID() })) || [],
    certifications: parsed.certifications?.map((c: any) => ({ ...c, id: crypto.randomUUID() })) || [],
    projects: parsed.projects?.map((p: any) => ({ ...p, id: crypto.randomUUID() })) || [],
  }
}
```

### Upload API Route

```typescript
// app/api/cv/upload/route.ts
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { parseCV } from '@/lib/cv-parser'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const supabase = await createClient()

  // Check free tier limit
  const { data: user } = await supabase
    .from('users')
    .select('id, subscription_tier')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return Response.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  if (user.subscription_tier === 'free') {
    const { count } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count >= 1) {
      return Response.json({
        success: false,
        error: { code: 'CV_LIMIT_REACHED', message: 'Free tier limited to 1 CV' }
      }, { status: 403 })
    }
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string || file.name.replace(/\.(pdf|docx)$/i, '')

  if (!file) {
    return Response.json({ success: false, error: { code: 'VALIDATION_ERROR' } }, { status: 400 })
  }

  // Validate file
  const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' :
                   file.name.toLowerCase().endsWith('.docx') ? 'docx' : null

  if (!fileType) {
    return Response.json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'Only PDF and DOCX files are supported' }
    }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return Response.json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'File must be under 5MB' }
    }, { status: 400 })
  }

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const cvId = crypto.randomUUID()
  const storagePath = `${userId}/${cvId}/${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('cv-uploads')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return Response.json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: uploadError.message }
    }, { status: 500 })
  }

  // Parse CV
  let parsedContent: ParsedCV
  try {
    parsedContent = await parseCV(buffer, fileType)
  } catch (e) {
    // Return empty template if parsing fails
    parsedContent = {
      contact: { name: '', email: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
    }
  }

  // Create CV record
  const { data: cv, error: insertError } = await supabase
    .from('cvs')
    .insert({
      id: cvId,
      user_id: user.id,
      title,
      original_file_url: storagePath,
      original_filename: file.name,
      file_type: fileType,
      parsed_content: parsedContent,
      is_primary: true, // First CV is primary
    })
    .select()
    .single()

  if (insertError) {
    return Response.json({
      success: false,
      error: { code: 'INSERT_FAILED', message: insertError.message }
    }, { status: 500 })
  }

  // Unset other primary CVs
  await supabase
    .from('cvs')
    .update({ is_primary: false })
    .eq('user_id', user.id)
    .neq('id', cvId)

  return Response.json({ success: true, data: { cv } })
}
```

### Supabase Migration (Sprint 2)

```sql
-- 002_create_cvs.sql
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

CREATE INDEX idx_cvs_user_id ON cvs(user_id);

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own CVs" ON cvs
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);
```

## Tasks

### Database & Storage (Day 1)

- [ ] Run CVs table migration
- [ ] Create cv-uploads storage bucket
- [ ] Set up storage RLS policies
- [ ] Generate updated TypeScript types

### CV Types & Validation (Day 1)

- [ ] Create types/cv.ts with all interfaces
- [ ] Create lib/validators/cv.ts with Zod schemas
- [ ] Install pdf-parse, mammoth packages

### File Upload (Day 2)

- [ ] Install and configure upload dependencies
- [ ] Create cv-upload-zone.tsx component (drag-drop)
- [ ] Create POST /api/cv/upload/route.ts
- [ ] Add file validation (type, size)
- [ ] Implement Supabase Storage upload
- [ ] Add free tier CV limit check

### CV Parsing (Day 2-3)

- [ ] Install @google/generative-ai
- [ ] Create lib/cv-parser.ts
- [ ] Implement PDF text extraction
- [ ] Implement DOCX text extraction
- [ ] Create Gemini prompt for structuring
- [ ] Add fallback for failed parsing
- [ ] Test with various CV formats

### CV List View (Day 3)

- [ ] Create GET /api/cv/route.ts
- [ ] Create cv-card.tsx component
- [ ] Create cv/page.tsx list view
- [ ] Add "Upload CV" button
- [ ] Add primary badge indicator
- [ ] Add delete action with confirmation

### CV Detail & Editor (Day 4)

- [ ] Create GET /api/cv/[id]/route.ts
- [ ] Create cv-viewer.tsx for display
- [ ] Create cv/[id]/page.tsx detail view
- [ ] Create cv-editor.tsx with react-hook-form
- [ ] Create section-editor.tsx for each section
- [ ] Implement auto-save with debounce
- [ ] Create PATCH /api/cv/[id]/route.ts

### Download & Delete (Day 4-5)

- [ ] Create GET /api/cv/[id]/download/route.ts (signed URL)
- [ ] Create DELETE /api/cv/[id]/route.ts
- [ ] Add download button to detail view
- [ ] Add delete with storage cleanup

### Polish (Day 5)

- [ ] Add loading states
- [ ] Add error handling UI
- [ ] Add toast notifications
- [ ] Add empty state for no CVs
- [ ] Mobile responsive adjustments

## Testing

### Manual Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Upload PDF | Upload valid PDF file | File stored, CV parsed and displayed |
| Upload DOCX | Upload valid DOCX file | File stored, CV parsed and displayed |
| Invalid file type | Try to upload .txt file | Error message shown |
| File too large | Try to upload 10MB file | Error: "File must be under 5MB" |
| Free tier limit | Upload 2nd CV as free user | Error: "Free tier limited to 1 CV" |
| View parsed CV | Open CV detail page | All sections displayed correctly |
| Edit CV section | Change summary text | Change saves, toast confirms |
| Add experience | Click add, fill form | New experience appears in list |
| Delete experience | Click delete on experience | Item removed after confirmation |
| Download original | Click download button | Original file downloads |
| Delete CV | Click delete, confirm | CV removed from list and storage |
| Set primary | Click "Set as primary" on non-primary CV | Badge moves to selected CV |
| Parse failure | Upload unparseable file | Empty template shown, can edit manually |

### Component Tests

```typescript
// __tests__/components/cv-upload-zone.test.tsx
describe('CVUploadZone', () => {
  it('accepts PDF files', async () => {})
  it('accepts DOCX files', async () => {})
  it('rejects invalid file types', async () => {})
  it('shows progress during upload', async () => {})
})
```

## Definition of Done

- [ ] Can upload PDF and DOCX files
- [ ] Files stored in Supabase Storage
- [ ] CV content parsed and structured
- [ ] Can view all CV sections
- [ ] Can edit any section with auto-save
- [ ] Can download original file
- [ ] Can delete CV (with storage cleanup)
- [ ] Free tier limited to 1 CV
- [ ] Error handling for all failure cases
- [ ] Mobile responsive
- [ ] No TypeScript errors

## Environment Variables (New)

```env
# Gemini (for CV parsing)
GEMINI_API_KEY=...
```

## Notes for LLM Agents

- pdf-parse requires a Node.js environment, not Edge runtime
- mammoth works with Buffer, not File objects
- Gemini sometimes returns markdown-wrapped JSON - strip it before parsing
- Supabase Storage paths: `{clerk_user_id}/{cv_id}/{filename}`
- Use `crypto.randomUUID()` for generating IDs
- Debounce auto-save to prevent excessive API calls (500ms recommended)
- Free tier check must happen before file upload to avoid orphaned files
