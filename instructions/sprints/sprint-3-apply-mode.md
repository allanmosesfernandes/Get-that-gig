# Sprint 3: Apply Mode (Core Feature)

**Duration:** 5-6 days
**Goal:** AI-powered CV tailoring with visual diff and accept/reject flow
**Prerequisites:** Sprint 2 complete (CV management working)

## Deliverables

1. Job description input interface
2. Gemini AI integration for CV suggestions
3. Visual diff showing suggestions
4. Accept/reject individual suggestions
5. Generate tailored CV PDF
6. Prompt to log application

## PRD

### User Stories

**US-3.1: Input Job Description**
> As a user, I want to paste a job description so the AI can analyze it against my CV.

Acceptance Criteria:
- Textarea for pasting job description
- Optional fields: company name, position, job URL
- Minimum 100 characters validation
- Select which CV to tailor (if multiple)

**US-3.2: Receive AI Suggestions**
> As a user, I want to see how my CV could be improved for this specific job.

Acceptance Criteria:
- AI analyzes JD vs CV
- Shows 5-15 actionable suggestions
- Each suggestion shows: what to change, original text, suggested text, reasoning
- Suggestions grouped by CV section
- Loading state during analysis

**US-3.3: Visual Diff**
> As a user, I want to see the before/after for each suggestion clearly.

Acceptance Criteria:
- Side-by-side or inline diff view
- Deletions highlighted in red
- Additions highlighted in green
- Toggle to see original vs suggested

**US-3.4: Accept/Reject Suggestions**
> As a user, I want to choose which suggestions to apply.

Acceptance Criteria:
- Accept/Reject buttons on each suggestion
- "Accept All" and "Reject All" options
- Counter showing accepted/total
- Can undo accept/reject

**US-3.5: Generate Tailored CV**
> As a user, I want to download my tailored CV as a PDF.

Acceptance Criteria:
- Apply accepted suggestions to CV
- Generate professional PDF
- Download immediately
- Store tailored CV for reference

**US-3.6: Log Application**
> As a user, after downloading, I want to quickly log this as an application.

Acceptance Criteria:
- Prompt: "Have you applied to this job?"
- Pre-filled with company/position from input
- Quick "Yes, log it" or "Not yet" options
- Creates application tracker entry

**US-3.7: Usage Limits**
> As a user on free tier, I understand my AI usage is limited.

Acceptance Criteria:
- Free tier: 5 AI sessions per month
- Show remaining usage before generating
- Clear upgrade prompt when limit reached
- Pro tier: unlimited (but 50/day soft limit)

## Technical Specification

### New Files

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── apply/
│   │       └── page.tsx           # Apply mode main page
│   └── api/
│       └── ai/
│           ├── suggest/route.ts   # Generate suggestions
│           └── apply/route.ts     # Apply suggestions, generate PDF
├── components/
│   └── apply-mode/
│       ├── job-input-form.tsx     # JD input form
│       ├── suggestions-panel.tsx  # List of suggestions
│       ├── suggestion-card.tsx    # Individual suggestion
│       ├── diff-view.tsx          # Visual diff component
│       ├── cv-preview.tsx         # Live preview of tailored CV
│       ├── apply-prompt.tsx       # "Have you applied?" modal
│       └── usage-indicator.tsx    # Show remaining AI sessions
├── lib/
│   ├── gemini.ts                  # Gemini client wrapper
│   └── pdf-generator.ts           # Generate CV PDFs
└── types/
    └── suggestions.ts             # Suggestion types
```

### Packages to Install

```bash
# PDF Generation
npm install @react-pdf/renderer

# Diff visualization (optional - can build custom)
npm install diff

# UI components
npx shadcn@latest add switch checkbox radio-group scroll-area sheet skeleton
```

### Type Definitions

```typescript
// types/suggestions.ts
export type SuggestionType = 'modify' | 'add' | 'remove'
export type CVSection = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications'

export interface Suggestion {
  id: string
  type: SuggestionType
  section: CVSection
  target: string           // What is being changed (e.g., "experience[0].bullets[2]")
  targetLabel: string      // Human-readable (e.g., "Software Engineer at TechCorp - bullet 3")
  original: string | null  // Original text (null for 'add')
  suggested: string        // Suggested text
  reasoning: string        // Why this helps for this job
  confidence: number       // 0-1, how confident AI is
  status: 'pending' | 'accepted' | 'rejected'
}

export interface SuggestionSession {
  id: string
  cv_id: string
  job_description: string
  company_name?: string
  position?: string
  job_url?: string
  suggestions: Suggestion[]
  tokens_used: number
  created_at: string
}

export interface ApplyModeState {
  step: 'input' | 'reviewing' | 'generating' | 'complete'
  cvId: string | null
  session: SuggestionSession | null
  acceptedCount: number
  error: string | null
}
```

### Gemini Suggestion Prompt

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateSuggestions(
  cv: ParsedCV,
  jobDescription: string,
  position?: string,
  company?: string
): Promise<{ suggestions: Suggestion[], tokensUsed: number }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `You are an expert career coach and CV optimization specialist. Analyze this CV against the job description and suggest specific improvements.

## Job Details
${position ? `Position: ${position}` : ''}
${company ? `Company: ${company}` : ''}

## Job Description
${jobDescription}

## Current CV
${JSON.stringify(cv, null, 2)}

## Your Task
Generate 5-15 specific, actionable suggestions to tailor this CV for this job. For each suggestion:

1. Identify WHERE in the CV to make the change (be specific: which bullet, which skill, etc.)
2. Show the ORIGINAL text (if modifying or removing)
3. Provide the SUGGESTED new text
4. Explain WHY this change improves the CV for THIS specific job
5. Rate your confidence (0.0-1.0)

Focus on:
- Matching keywords from the job description
- Quantifying achievements where possible
- Highlighting relevant experience
- Reordering skills to prioritize relevant ones
- Strengthening the summary for this role
- Removing irrelevant information

## Output Format
Return ONLY valid JSON array:
[
  {
    "type": "modify" | "add" | "remove",
    "section": "summary" | "experience" | "skills" | "education" | "projects" | "certifications",
    "target": "path.to.item (e.g., experience[0].bullets[2] or skills[5])",
    "targetLabel": "Human readable description",
    "original": "original text or null",
    "suggested": "new text",
    "reasoning": "why this helps",
    "confidence": 0.85
  }
]

Be specific and actionable. Each suggestion should clearly improve the CV for this job.`

  const result = await model.generateContent(prompt)
  const response = result.response

  const jsonStr = response.text().replace(/```json\n?|\n?```/g, '').trim()
  const suggestions = JSON.parse(jsonStr)

  // Add IDs and default status
  const processedSuggestions = suggestions.map((s: any) => ({
    ...s,
    id: crypto.randomUUID(),
    status: 'pending' as const,
  }))

  return {
    suggestions: processedSuggestions,
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
  }
}
```

### Suggest API Route

```typescript
// app/api/ai/suggest/route.ts
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { generateSuggestions } from '@/lib/gemini'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const supabase = await createClient()

  // Get user and check limits
  const { data: user } = await supabase
    .from('users')
    .select('id, subscription_tier')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return Response.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // Check free tier limit (5 per month)
  if (user.subscription_tier === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('ai_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if (count && count >= 5) {
      return Response.json({
        success: false,
        error: {
          code: 'AI_LIMIT_REACHED',
          message: 'Free tier limited to 5 AI sessions per month. Upgrade to Pro for unlimited.'
        }
      }, { status: 403 })
    }
  }

  const body = await req.json()
  const { cv_id, job_description, company_name, position, job_url } = body

  // Validate
  if (!cv_id || !job_description) {
    return Response.json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'CV ID and job description required' }
    }, { status: 400 })
  }

  if (job_description.length < 100) {
    return Response.json({
      success: false,
      error: { code: 'JOB_DESCRIPTION_TOO_SHORT', message: 'Job description must be at least 100 characters' }
    }, { status: 400 })
  }

  // Get CV
  const { data: cv, error: cvError } = await supabase
    .from('cvs')
    .select('*')
    .eq('id', cv_id)
    .eq('user_id', user.id)
    .single()

  if (cvError || !cv) {
    return Response.json({ success: false, error: { code: 'CV_NOT_FOUND' } }, { status: 404 })
  }

  try {
    // Generate suggestions
    const { suggestions, tokensUsed } = await generateSuggestions(
      cv.parsed_content,
      job_description,
      position,
      company_name
    )

    // Store suggestion session
    const { data: session, error: insertError } = await supabase
      .from('ai_suggestions')
      .insert({
        user_id: user.id,
        original_cv_snapshot: cv.parsed_content,
        job_description,
        suggestions,
        tokens_used: tokensUsed,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Increment daily stats
    await supabase.rpc('increment_daily_ai_sessions', { p_user_id: user.id })

    return Response.json({
      success: true,
      data: {
        suggestion_id: session.id,
        suggestions,
        tokens_used: tokensUsed,
      }
    })

  } catch (error: any) {
    console.error('AI suggestion error:', error)
    return Response.json({
      success: false,
      error: { code: 'AI_SERVICE_ERROR', message: error.message }
    }, { status: 502 })
  }
}
```

### PDF Generation

```typescript
// lib/pdf-generator.ts
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  contact: { fontSize: 10, color: '#666', marginTop: 4 },
  section: { marginTop: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottom: '1 solid #000', paddingBottom: 4 },
  item: { marginTop: 8 },
  itemTitle: { fontSize: 11, fontWeight: 'bold' },
  itemSubtitle: { fontSize: 10, color: '#444' },
  bullet: { fontSize: 10, marginLeft: 10, marginTop: 2 },
  skills: { fontSize: 10, marginTop: 4 },
  summary: { fontSize: 10, marginTop: 4, lineHeight: 1.4 },
})

export async function generateTailoredCV(cv: ParsedCV): Promise<Buffer> {
  const CVDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{cv.contact.name}</Text>
          <Text style={styles.contact}>
            {[cv.contact.email, cv.contact.phone, cv.contact.location].filter(Boolean).join(' | ')}
          </Text>
          {cv.contact.linkedin && <Text style={styles.contact}>{cv.contact.linkedin}</Text>}
        </View>

        {/* Summary */}
        {cv.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{cv.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {cv.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {cv.experience.map((exp) => (
              <View key={exp.id} style={styles.item}>
                <Text style={styles.itemTitle}>{exp.title} at {exp.company}</Text>
                <Text style={styles.itemSubtitle}>
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate} | {exp.location}
                </Text>
                {exp.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>• {bullet}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {cv.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {cv.education.map((edu) => (
              <View key={edu.id} style={styles.item}>
                <Text style={styles.itemTitle}>{edu.degree} in {edu.field}</Text>
                <Text style={styles.itemSubtitle}>{edu.institution} | {edu.endDate}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {cv.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skills}>{cv.skills.join(' • ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  )

  const pdfDoc = await pdf(<CVDocument />).toBuffer()
  return Buffer.from(pdfDoc)
}
```

### Database Updates

```sql
-- Add to ai_suggestions table
ALTER TABLE ai_suggestions ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);

-- Function to increment AI sessions
CREATE OR REPLACE FUNCTION increment_daily_ai_sessions(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, ai_sessions_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET ai_sessions_count = daily_stats.ai_sessions_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Tasks

### Setup (Day 1)

- [ ] Install @google/generative-ai, @react-pdf/renderer, diff
- [ ] Add new shadcn components
- [ ] Create types/suggestions.ts
- [ ] Create lib/gemini.ts wrapper

### Job Input Form (Day 1)

- [ ] Create job-input-form.tsx component
- [ ] CV selector dropdown
- [ ] Job description textarea with validation
- [ ] Optional company/position/URL fields
- [ ] Create usage-indicator.tsx showing remaining sessions

### AI Suggestion API (Day 2)

- [ ] Create POST /api/ai/suggest/route.ts
- [ ] Implement free tier limit check
- [ ] Craft and test Gemini prompt
- [ ] Store suggestions in database
- [ ] Handle API errors gracefully

### Suggestion Display (Day 2-3)

- [ ] Create suggestions-panel.tsx
- [ ] Create suggestion-card.tsx
- [ ] Group suggestions by section
- [ ] Show confidence indicator
- [ ] Expandable reasoning

### Visual Diff (Day 3)

- [ ] Create diff-view.tsx component
- [ ] Highlight additions (green) and removals (red)
- [ ] Toggle original vs suggested view
- [ ] Handle multiline changes

### Accept/Reject Flow (Day 3-4)

- [ ] Add Accept/Reject buttons to suggestion cards
- [ ] Implement Accept All / Reject All
- [ ] Show counter of accepted/total
- [ ] Allow undo (toggle status)
- [ ] Persist state in component

### PDF Generation (Day 4)

- [ ] Create lib/pdf-generator.ts
- [ ] Design professional CV template
- [ ] Handle all CV sections
- [ ] Test with various CV content

### Apply API (Day 4-5)

- [ ] Create POST /api/ai/apply/route.ts
- [ ] Apply accepted suggestions to CV
- [ ] Generate tailored PDF
- [ ] Upload to tailored-cvs bucket
- [ ] Return download URL

### Application Prompt (Day 5)

- [ ] Create apply-prompt.tsx modal
- [ ] Pre-fill company/position
- [ ] Quick "Log it" button
- [ ] Create application record
- [ ] Link to application tracker

### Apply Mode Page (Day 5-6)

- [ ] Create apply/page.tsx with full flow
- [ ] State machine for steps: input → reviewing → generating → complete
- [ ] Loading states between steps
- [ ] Error handling at each step
- [ ] Success state with download

### Polish (Day 6)

- [ ] Add skeleton loading
- [ ] Improve error messages
- [ ] Mobile responsive adjustments
- [ ] Test end-to-end flow
- [ ] Add analytics tracking

## Testing

### Manual Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Submit JD | Paste JD, select CV, submit | Loading, then suggestions appear |
| JD too short | Paste <100 chars | Error: minimum 100 characters |
| Free tier limit | Use 5 sessions, try 6th | Error: limit reached, upgrade prompt |
| View suggestions | After generation | 5-15 suggestions grouped by section |
| See diff | Click suggestion | Visual diff with red/green highlighting |
| Accept suggestion | Click Accept | Card shows accepted state, counter updates |
| Reject suggestion | Click Reject | Card shows rejected state |
| Accept all | Click Accept All | All suggestions accepted |
| Undo accept | Click accepted card | Reverts to pending |
| Generate PDF | Accept some, click Generate | Loading, then download prompt |
| Download PDF | Click download | PDF downloads with tailored content |
| Log application | Click "Log it" | Application created, link to tracker |
| Skip logging | Click "Not yet" | Modal closes, can continue |

### Integration Tests

```typescript
// __tests__/api/ai/suggest.test.ts
describe('POST /api/ai/suggest', () => {
  it('returns suggestions for valid input', async () => {})
  it('enforces free tier limit', async () => {})
  it('rejects short job descriptions', async () => {})
  it('requires authentication', async () => {})
})
```

## Definition of Done

- [ ] Can input job description with optional details
- [ ] AI generates 5-15 relevant suggestions
- [ ] Visual diff clearly shows changes
- [ ] Can accept/reject individual suggestions
- [ ] Can accept all / reject all
- [ ] Can generate tailored CV PDF
- [ ] PDF looks professional
- [ ] Can log application after download
- [ ] Free tier limited to 5 sessions/month
- [ ] Usage indicator accurate
- [ ] Error handling for all failure cases
- [ ] Mobile responsive
- [ ] No TypeScript errors

## Notes for LLM Agents

- Gemini 1.5 Pro has 1M token context - can handle large CVs and JDs
- @react-pdf/renderer must run on server (not Edge runtime)
- Use `pdf().toBuffer()` for server-side generation
- Suggestion targets use dot notation: `experience[0].bullets[2]`
- Store original CV snapshot with suggestions for debugging
- Confidence scores help users prioritize which suggestions to accept
- Free tier limit is per calendar month, not rolling 30 days
- tailored-cvs bucket path: `{clerk_user_id}/{application_id}/tailored-cv.pdf`
