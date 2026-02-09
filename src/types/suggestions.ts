export type SuggestionType = 'modify' | 'add' | 'remove';

export type CVSection =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  section: CVSection;
  target: string; // e.g., "experience.0.highlights.2" or "skills.3"
  targetLabel: string; // Human-readable label, e.g., "Software Engineer at Google - Highlight 3"
  original: string | null;
  suggested: string;
  reasoning: string;
  confidence: number; // 0-1
  status: 'pending' | 'accepted' | 'rejected';
}

export interface SuggestionSession {
  id: string;
  user_id: string;
  cv_id: string;
  job_description: string;
  company_name?: string;
  position?: string;
  job_url?: string;
  suggestions: Suggestion[];
  tokens_used: number;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  cv_id: string | null;
  tailored_cv_id: string | null;
  company_name: string;
  position: string;
  job_url: string | null;
  job_description: string | null;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  applied_at: string;
  notes: string | null;
  tailored_cv_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  ai_sessions_used: number;
  applications_submitted: number;
  created_at: string;
  updated_at: string;
}

// Free tier limit
export const FREE_TIER_AI_SESSIONS_PER_MONTH = 5;
