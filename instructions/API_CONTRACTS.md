# API Contracts

## Overview

All API routes are Next.js App Router API routes under `/app/api/`.

Authentication is handled via Clerk middleware. All endpoints (except webhooks) require authentication.

## Base Response Format

```typescript
// Success
{
  success: true,
  data: T
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## Endpoints

### Webhooks

#### POST /api/webhooks/clerk

Handles Clerk user events to sync users to Supabase.

**Headers:**
- `svix-id`: Webhook ID
- `svix-timestamp`: Unix timestamp
- `svix-signature`: HMAC signature

**Events handled:**
- `user.created` - Create user in Supabase
- `user.updated` - Update user in Supabase
- `user.deleted` - Delete user and cascade

**Response:** `200 OK` or `400 Bad Request`

---

#### POST /api/webhooks/stripe

Handles Stripe subscription events.

**Headers:**
- `stripe-signature`: Webhook signature

**Events handled:**
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update tier
- `customer.subscription.deleted` - Downgrade to free

**Response:** `200 OK` or `400 Bad Request`

---

### CV Management

#### GET /api/cv

List all CVs for current user.

**Response:**
```typescript
{
  success: true,
  data: {
    cvs: Array<{
      id: string
      title: string
      is_primary: boolean
      original_filename: string
      file_type: 'pdf' | 'docx'
      created_at: string
      updated_at: string
    }>
  }
}
```

---

#### POST /api/cv/upload

Upload a new CV file.

**Request:** `multipart/form-data`
- `file`: PDF or DOCX file (max 5MB)
- `title`: string (optional, defaults to filename)

**Response:**
```typescript
{
  success: true,
  data: {
    cv: {
      id: string
      title: string
      original_file_url: string
      parsed_content: ParsedCV
    }
  }
}
```

**Errors:**
- `FILE_TOO_LARGE` - File exceeds 5MB
- `INVALID_FILE_TYPE` - Not PDF or DOCX
- `CV_LIMIT_REACHED` - Free tier limited to 1 CV
- `PARSE_FAILED` - Could not extract CV content

---

#### GET /api/cv/[id]

Get a specific CV with parsed content.

**Response:**
```typescript
{
  success: true,
  data: {
    cv: {
      id: string
      title: string
      original_file_url: string
      original_filename: string
      file_type: string
      parsed_content: ParsedCV
      is_primary: boolean
      created_at: string
      updated_at: string
    }
  }
}
```

---

#### PATCH /api/cv/[id]

Update CV metadata or parsed content.

**Request:**
```typescript
{
  title?: string
  is_primary?: boolean
  parsed_content?: ParsedCV
}
```

**Response:** Updated CV object

---

#### DELETE /api/cv/[id]

Delete a CV and its storage files.

**Response:**
```typescript
{
  success: true,
  data: { deleted: true }
}
```

---

#### GET /api/cv/[id]/download

Get signed URL for original CV download.

**Response:**
```typescript
{
  success: true,
  data: {
    url: string  // Signed URL, expires in 1 hour
    filename: string
  }
}
```

---

### AI Suggestions

#### POST /api/ai/suggest

Generate CV tailoring suggestions for a job description.

**Request:**
```typescript
{
  cv_id: string
  job_description: string
  job_url?: string
  company_name?: string
  position?: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    suggestion_id: string
    suggestions: Array<{
      id: string
      type: 'modify' | 'add' | 'remove'
      section: 'experience' | 'skills' | 'summary' | 'education' | 'projects'
      target: string
      original: string | null
      suggested: string
      reasoning: string
      confidence: number
    }>
    tokens_used: number
  }
}
```

**Errors:**
- `CV_NOT_FOUND` - CV doesn't exist
- `AI_LIMIT_REACHED` - Free tier: 5/month limit
- `JOB_DESCRIPTION_TOO_SHORT` - Minimum 100 characters
- `AI_SERVICE_ERROR` - Gemini API error

---

#### POST /api/ai/apply

Apply accepted suggestions and generate tailored CV.

**Request:**
```typescript
{
  suggestion_id: string
  accepted_suggestion_ids: string[]
  rejected_suggestion_ids: string[]
  application?: {
    company_name: string
    position: string
    job_url?: string
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    tailored_cv_url: string  // Signed download URL
    application_id?: string  // If application was created
  }
}
```

---

### Applications

#### GET /api/applications

List applications with filtering.

**Query params:**
- `status` - Filter by status
- `month` - Filter by month (YYYY-MM)
- `search` - Search company/position
- `limit` - Page size (default 20)
- `offset` - Pagination offset

**Response:**
```typescript
{
  success: true,
  data: {
    applications: Array<{
      id: string
      company_name: string
      position: string
      status: string
      applied_at: string
      job_url: string | null
      notes: string | null
      cv: { id: string, title: string } | null
    }>
    total: number
    has_more: boolean
  }
}
```

---

#### POST /api/applications

Create a new application.

**Request:**
```typescript
{
  company_name: string
  position: string
  status?: string
  applied_at?: string
  job_url?: string
  job_description?: string
  notes?: string
  cv_id?: string
}
```

**Response:** Created application object

**Errors:**
- `APPLICATION_LIMIT_REACHED` - Free tier: 20 active applications

---

#### GET /api/applications/[id]

Get application details.

**Response:** Full application object with CV and AI suggestions

---

#### PATCH /api/applications/[id]

Update application.

**Request:**
```typescript
{
  status?: string
  notes?: string
  company_name?: string
  position?: string
}
```

---

#### DELETE /api/applications/[id]

Delete application.

---

#### GET /api/applications/export

Export applications as CSV.

**Query params:**
- `status` - Filter by status
- `from` - Start date
- `to` - End date

**Response:** CSV file download

---

### Stats & Analytics

#### GET /api/stats/daily

Get daily application stats.

**Query params:**
- `date` - Specific date (defaults to today)

**Response:**
```typescript
{
  success: true,
  data: {
    date: string
    applications_count: number
    ai_sessions_count: number
    encouragement_message?: string
    should_take_break: boolean
  }
}
```

---

#### GET /api/stats/analytics

Get analytics for dashboard.

**Query params:**
- `period` - 'week' | 'month' | 'all'

**Response:**
```typescript
{
  success: true,
  data: {
    total_applications: number
    applications_by_status: Record<string, number>
    applications_over_time: Array<{ date: string, count: number }>
    response_rate: number
    avg_time_to_response: number | null
    top_companies: Array<{ name: string, count: number }>
    current_streak: number
  }
}
```

---

### Subscription

#### GET /api/subscription

Get current subscription status.

**Response:**
```typescript
{
  success: true,
  data: {
    tier: 'free' | 'pro'
    usage: {
      cvs: { used: number, limit: number | null }
      ai_sessions: { used: number, limit: number | null }
      applications: { used: number, limit: number | null }
    }
    stripe_customer_id?: string
    current_period_end?: string
  }
}
```

---

#### POST /api/subscription/checkout

Create Stripe checkout session.

**Request:**
```typescript
{
  price_id: string  // Monthly or annual
  success_url: string
  cancel_url: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    checkout_url: string
  }
}
```

---

#### POST /api/subscription/portal

Create Stripe customer portal session.

**Response:**
```typescript
{
  success: true,
  data: {
    portal_url: string
  }
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /api/ai/suggest | 10/minute |
| POST /api/cv/upload | 5/minute |
| All other endpoints | 60/minute |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |
| `CV_LIMIT_REACHED` | 403 | Free tier CV limit |
| `AI_LIMIT_REACHED` | 403 | Free tier AI limit |
| `APPLICATION_LIMIT_REACHED` | 403 | Free tier application limit |
| `FILE_TOO_LARGE` | 400 | Upload exceeds 5MB |
| `INVALID_FILE_TYPE` | 400 | Unsupported file type |
| `AI_SERVICE_ERROR` | 502 | Gemini API error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
