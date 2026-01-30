# Sprint 4: Application Tracker

**Duration:** 3-4 days
**Goal:** Full CRUD application tracker with filtering and export
**Prerequisites:** Sprint 3 complete (Apply Mode working)

## Deliverables

1. Application list with table view
2. Add/Edit/Delete applications
3. Status management workflow
4. Filter by status, date, search
5. CSV export

## PRD

### User Stories

**US-4.1: View Applications**
> As a user, I want to see all my job applications in a table so I can track my progress.

Acceptance Criteria:
- Table columns: Company, Position, Status, Applied Date, Notes (truncated)
- Sorted by applied date (newest first)
- Pagination (20 per page)
- Click row to view details

**US-4.2: Add Application Manually**
> As a user, I want to add applications I made outside the app.

Acceptance Criteria:
- Form: Company (required), Position (required), Status, Applied Date, Job URL, Notes
- Defaults: Status = Applied, Date = Today
- Success toast on save

**US-4.3: Update Application Status**
> As a user, I want to update the status as my application progresses.

Acceptance Criteria:
- Status options: Applied, Interviewing, Offered, Rejected, Ghosted, Withdrawn
- Quick status change from table row
- Status badge with color coding
- Update notes when changing status

**US-4.4: Filter Applications**
> As a user, I want to filter my applications to find specific ones.

Acceptance Criteria:
- Filter by status (multi-select)
- Filter by month/year
- Search by company or position
- Clear all filters button
- URL reflects filters (shareable)

**US-4.5: Export to CSV**
> As a user, I want to export my applications for backup or analysis.

Acceptance Criteria:
- Export button downloads CSV
- Includes all fields
- Respects current filters
- Filename: `applications-YYYY-MM-DD.csv`

**US-4.6: Application Details**
> As a user, I want to see full details of an application including the job description.

Acceptance Criteria:
- Shows all application fields
- Shows linked CV (if any)
- Shows job description (if saved)
- Can download tailored CV (if generated)
- Edit and Delete buttons

## Technical Specification

### New Files

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── track/
│   │       ├── page.tsx              # Application list
│   │       ├── new/page.tsx          # Add application
│   │       └── [id]/
│   │           ├── page.tsx          # Application detail
│   │           └── edit/page.tsx     # Edit application
│   └── api/
│       └── applications/
│           ├── route.ts              # GET list, POST create
│           ├── [id]/route.ts         # GET, PATCH, DELETE
│           └── export/route.ts       # GET CSV export
├── components/
│   └── tracker/
│       ├── application-table.tsx     # Main table component
│       ├── application-row.tsx       # Table row
│       ├── application-form.tsx      # Add/Edit form
│       ├── status-badge.tsx          # Colored status badge
│       ├── status-select.tsx         # Status dropdown
│       ├── filter-bar.tsx            # Filter controls
│       └── application-detail.tsx    # Detail view
└── lib/
    └── csv.ts                        # CSV generation utility
```

### Packages to Install

```bash
# Table (optional - can use native)
npm install @tanstack/react-table

# Date handling
npm install date-fns

# UI Components
npx shadcn@latest add table select popover calendar command
```

### Status Configuration

```typescript
// lib/constants.ts
export const APPLICATION_STATUSES = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  ghosted: { label: 'Ghosted', color: 'bg-gray-100 text-gray-800' },
  withdrawn: { label: 'Withdrawn', color: 'bg-purple-100 text-purple-800' },
} as const

export type ApplicationStatus = keyof typeof APPLICATION_STATUSES
```

### API: List Applications

```typescript
// app/api/applications/route.ts
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')?.split(',').filter(Boolean)
  const month = searchParams.get('month') // YYYY-MM
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return Response.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  let query = supabase
    .from('applications')
    .select('*, cvs(id, title)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  // Apply filters
  if (status && status.length > 0) {
    query = query.in('status', status)
  }

  if (month) {
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0)
    query = query
      .gte('applied_at', startDate.toISOString().split('T')[0])
      .lte('applied_at', endDate.toISOString().split('T')[0])
  }

  if (search) {
    query = query.or(`company_name.ilike.%${search}%,position.ilike.%${search}%`)
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data: applications, count, error } = await query

  if (error) {
    return Response.json({ success: false, error: { code: 'QUERY_FAILED' } }, { status: 500 })
  }

  return Response.json({
    success: true,
    data: {
      applications,
      total: count || 0,
      has_more: (count || 0) > offset + limit,
    }
  })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, subscription_tier')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    return Response.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // Check free tier limit (20 active applications)
  if (user.subscription_tier === 'free') {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('status', 'in', '(rejected,withdrawn)')

    if (count && count >= 20) {
      return Response.json({
        success: false,
        error: { code: 'APPLICATION_LIMIT_REACHED', message: 'Free tier limited to 20 active applications' }
      }, { status: 403 })
    }
  }

  const body = await req.json()
  const { company_name, position, status, applied_at, job_url, job_description, notes, cv_id } = body

  if (!company_name || !position) {
    return Response.json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Company and position required' }
    }, { status: 400 })
  }

  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company_name,
      position,
      status: status || 'applied',
      applied_at: applied_at || new Date().toISOString().split('T')[0],
      job_url,
      job_description,
      notes,
      cv_id,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ success: false, error: { code: 'INSERT_FAILED' } }, { status: 500 })
  }

  // Increment daily stats
  await supabase.rpc('increment_daily_applications', { p_user_id: user.id })

  return Response.json({ success: true, data: { application } })
}
```

### CSV Export

```typescript
// lib/csv.ts
export function generateCSV(applications: any[]): string {
  const headers = [
    'Company',
    'Position',
    'Status',
    'Applied Date',
    'Job URL',
    'Notes',
  ]

  const rows = applications.map(app => [
    app.company_name,
    app.position,
    app.status,
    app.applied_at,
    app.job_url || '',
    (app.notes || '').replace(/"/g, '""'), // Escape quotes
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// app/api/applications/export/route.ts
export async function GET(req: Request) {
  // ... auth and query same as list ...

  const csv = generateCSV(applications)
  const filename = `applications-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  })
}
```

## Tasks

### Database (Day 1)

- [ ] Run applications table migration (if not done)
- [ ] Add indexes for filtering
- [ ] Test RLS policies

### API Endpoints (Day 1)

- [ ] Create GET /api/applications (list with filters)
- [ ] Create POST /api/applications (create)
- [ ] Create GET /api/applications/[id] (detail)
- [ ] Create PATCH /api/applications/[id] (update)
- [ ] Create DELETE /api/applications/[id] (delete)
- [ ] Create GET /api/applications/export (CSV)

### Table Component (Day 2)

- [ ] Create application-table.tsx
- [ ] Create application-row.tsx
- [ ] Create status-badge.tsx with colors
- [ ] Add click-to-edit status
- [ ] Add pagination controls
- [ ] Add empty state

### Filter Bar (Day 2)

- [ ] Create filter-bar.tsx
- [ ] Status multi-select filter
- [ ] Month picker filter
- [ ] Search input with debounce
- [ ] Clear filters button
- [ ] Sync filters to URL

### Add/Edit Forms (Day 3)

- [ ] Create application-form.tsx
- [ ] Create track/new/page.tsx
- [ ] Create track/[id]/edit/page.tsx
- [ ] Form validation
- [ ] Success/error handling

### Detail View (Day 3)

- [ ] Create application-detail.tsx
- [ ] Create track/[id]/page.tsx
- [ ] Show all fields
- [ ] Download tailored CV link
- [ ] Edit/Delete buttons

### Export & Polish (Day 4)

- [ ] Implement CSV export
- [ ] Add export button to UI
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsive table
- [ ] Integration with Apply Mode

## Testing

### Manual Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| View applications | Go to /track | Table shows applications |
| Empty state | No applications | Empty state message, Add button |
| Add application | Fill form, submit | Application in table |
| Edit application | Click edit, change field | Changes saved |
| Change status | Click status badge | Dropdown, select new status |
| Filter by status | Select "Interviewing" | Only matching apps shown |
| Filter by month | Select month | Only that month shown |
| Search | Type company name | Filtered results |
| Clear filters | Click clear | All applications shown |
| Export CSV | Click export | CSV downloads |
| Delete | Click delete, confirm | Application removed |
| Free tier limit | Add 21st application | Error message |

## Definition of Done

- [ ] Can view all applications in table
- [ ] Can add new application manually
- [ ] Can edit application details
- [ ] Can change status with quick action
- [ ] Can filter by status, month, search
- [ ] Can export to CSV
- [ ] Can delete application
- [ ] Free tier limited to 20 active applications
- [ ] Integrates with Apply Mode logging
- [ ] Mobile responsive
- [ ] No TypeScript errors

## Notes for LLM Agents

- Use `@tanstack/react-table` for complex table features or build simple table with native elements
- Status colors defined in `lib/constants.ts`
- Filters should sync to URL search params for bookmarking
- "Active" applications = not rejected or withdrawn
- CSV export respects current filters
- date-fns for date formatting: `format(date, 'MMM d, yyyy')`
