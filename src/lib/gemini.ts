import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCV } from '@/types/cv';
import { Suggestion, CVSection } from '@/types/suggestions';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SUGGESTION_PROMPT = `You are an expert CV/Resume consultant. Analyze the provided CV against the job description and suggest specific improvements to make the CV more relevant and impactful for this position.

## CV Content:
{cv_json}

## Job Description:
{job_description}

{position_context}

## Instructions:
Generate 5-15 specific, actionable suggestions to tailor this CV for the job. Focus on:
1. Modifying existing content to better match job requirements
2. Adding missing keywords, skills, or achievements that are relevant
3. Removing or de-emphasizing irrelevant content
4. Rewriting bullet points to highlight relevant experience

Return ONLY valid JSON (no markdown code blocks, no explanations) with this exact structure:
{
  "suggestions": [
    {
      "id": "sugg-1",
      "type": "modify" | "add" | "remove",
      "section": "contact" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications",
      "target": "path.to.field (e.g., 'experience.0.highlights.2' or 'skills.3' or 'summary')",
      "targetLabel": "Human-readable description (e.g., 'Software Engineer at Google - Highlight 3')",
      "original": "original text or null for 'add' type",
      "suggested": "the new/improved text",
      "reasoning": "why this change helps match the job description",
      "confidence": 0.0 to 1.0 (how confident this suggestion improves the CV)
    }
  ],
  "analysis": {
    "match_score": 0 to 100,
    "key_matches": ["list of matching skills/experiences"],
    "gaps": ["list of missing requirements"]
  }
}

## Rules:
1. Each suggestion must have a unique ID (sugg-1, sugg-2, etc.)
2. For 'modify' type, include both original and suggested text
3. For 'add' type, original should be null
4. For 'remove' type, suggested should be empty string
5. Target paths must be valid JSON paths into the CV structure
6. Prioritize high-impact changes first
7. Be specific and actionable - avoid vague suggestions
8. Focus on quantifiable achievements where possible
9. Ensure suggestions align with ATS (Applicant Tracking System) best practices
10. Return ONLY the JSON object, no other text`;

interface SuggestionResponse {
  suggestions: Suggestion[];
  analysis: {
    match_score: number;
    key_matches: string[];
    gaps: string[];
  };
}

export interface GenerateSuggestionsResult {
  suggestions: Suggestion[];
  analysis: {
    match_score: number;
    key_matches: string[];
    gaps: string[];
  };
  tokens_used: number;
}

/**
 * Generate CV tailoring suggestions using Gemini
 */
export async function generateSuggestions(
  cv: ParsedCV,
  jobDescription: string,
  position?: string,
  company?: string
): Promise<GenerateSuggestionsResult> {
  console.log('[Gemini] Generating suggestions for CV');
  console.log('[Gemini] API Key present:', !!process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Build position context
  let positionContext = '';
  if (position || company) {
    positionContext = '## Position Context:\n';
    if (position) positionContext += `Position: ${position}\n`;
    if (company) positionContext += `Company: ${company}\n`;
  }

  // Build the prompt
  const prompt = SUGGESTION_PROMPT
    .replace('{cv_json}', JSON.stringify(cv, null, 2))
    .replace('{job_description}', jobDescription)
    .replace('{position_context}', positionContext);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('[Gemini] Response length:', text.length);

    // Strip markdown code blocks if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    text = text.trim();

    const parsed = JSON.parse(text) as SuggestionResponse;

    // Add 'pending' status to all suggestions
    const suggestions: Suggestion[] = parsed.suggestions.map((s) => ({
      ...s,
      status: 'pending' as const,
    }));

    // Estimate tokens used (rough approximation)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const tokensUsed = inputTokens + outputTokens;

    console.log('[Gemini] Generated', suggestions.length, 'suggestions');
    console.log('[Gemini] Estimated tokens:', tokensUsed);

    return {
      suggestions,
      analysis: parsed.analysis,
      tokens_used: tokensUsed,
    };
  } catch (error) {
    console.error('[Gemini] Error generating suggestions:', error);
    throw new Error('Failed to generate suggestions. Please try again.');
  }
}

/**
 * Apply accepted suggestions to a CV
 */
export function applySuggestions(
  cv: ParsedCV,
  suggestions: Suggestion[]
): ParsedCV {
  // Deep clone the CV
  const tailoredCV: ParsedCV = JSON.parse(JSON.stringify(cv));

  // Filter to only accepted suggestions
  const acceptedSuggestions = suggestions.filter((s) => s.status === 'accepted');

  console.log('[applySuggestions] Applying', acceptedSuggestions.length, 'accepted suggestions');

  for (const suggestion of acceptedSuggestions) {
    try {
      applyToPath(tailoredCV as unknown as Record<string, unknown>, suggestion.target, suggestion.type, suggestion.suggested);
    } catch (error) {
      console.error('[applySuggestions] Error applying suggestion:', suggestion.id, error);
    }
  }

  return tailoredCV;
}

/**
 * Apply a single suggestion to a path in the CV
 */
function applyToPath(
  obj: Record<string, unknown>,
  path: string,
  type: 'modify' | 'add' | 'remove',
  value: string
): void {
  const parts = path.split('.');

  if (parts.length === 1) {
    // Direct property
    if (type === 'remove') {
      if (typeof obj[parts[0]] === 'string') {
        obj[parts[0]] = '';
      }
    } else {
      obj[parts[0]] = value;
    }
    return;
  }

  // Navigate to parent
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const index = parseInt(part, 10);

    if (!isNaN(index) && Array.isArray(current)) {
      current = current[index];
    } else if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      console.warn('[applyToPath] Cannot navigate path:', path);
      return;
    }
  }

  const lastPart = parts[parts.length - 1];
  const lastIndex = parseInt(lastPart, 10);

  if (type === 'add') {
    // For arrays, push new item
    if (Array.isArray(current)) {
      (current as string[]).push(value);
    } else if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[lastPart] = value;
    }
  } else if (type === 'remove') {
    // For arrays, splice out the item
    if (!isNaN(lastIndex) && Array.isArray(current)) {
      current.splice(lastIndex, 1);
    } else if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[lastPart] = '';
    }
  } else {
    // Modify
    if (!isNaN(lastIndex) && Array.isArray(current)) {
      current[lastIndex] = value;
    } else if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[lastPart] = value;
    }
  }
}

/**
 * Get a human-readable label for a CV section
 */
export function getSectionLabel(section: CVSection): string {
  const labels: Record<CVSection, string> = {
    contact: 'Contact Information',
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
  };
  return labels[section];
}
