import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase/server';
import { generateSuggestions } from '@/lib/gemini';
import { FREE_TIER_AI_SESSIONS_PER_MONTH } from '@/types/suggestions';
import { z } from 'zod';

// Must use Node.js runtime for Gemini API
export const runtime = 'nodejs';

const requestSchema = z.object({
  cv_id: z.string().uuid(),
  job_description: z.string().min(100, 'Job description must be at least 100 characters'),
  company_name: z.string().optional(),
  position: z.string().optional(),
  job_url: z.string().url().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user in Supabase
    const { user, error: userError } = await getOrCreateUser(userId);

    if (userError || !user) {
      return NextResponse.json({ error: userError || 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cv_id, job_description, company_name, position, job_url } = parsed.data;

    // Check free tier limit
    const { data: monthlyUsage } = await supabaseAdmin.rpc('get_monthly_ai_sessions', {
      p_user_id: user.id,
    });

    const sessionsUsed = monthlyUsage ?? 0;
    const isFreeUser = user.subscription_tier === 'free';

    if (isFreeUser && sessionsUsed >= FREE_TIER_AI_SESSIONS_PER_MONTH) {
      return NextResponse.json(
        {
          error: 'Free tier limit reached',
          sessions_used: sessionsUsed,
          limit: FREE_TIER_AI_SESSIONS_PER_MONTH,
        },
        { status: 429 }
      );
    }

    // Fetch the CV
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .eq('user_id', user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    // Generate suggestions using Gemini
    const result = await generateSuggestions(
      cv.parsed_content,
      job_description,
      position,
      company_name
    );

    // Store the session in ai_suggestions table
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('ai_suggestions')
      .insert({
        user_id: user.id,
        cv_id,
        job_description,
        company_name: company_name || null,
        position: position || null,
        job_url: job_url || null,
        suggestions: result.suggestions,
        tokens_used: result.tokens_used,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error storing AI session:', sessionError);
      // Don't fail the request, just log the error
    }

    // Increment daily AI sessions counter
    await supabaseAdmin.rpc('increment_daily_ai_sessions', {
      p_user_id: user.id,
    });

    return NextResponse.json({
      session_id: session?.id,
      suggestions: result.suggestions,
      analysis: result.analysis,
      tokens_used: result.tokens_used,
      sessions_used: sessionsUsed + 1,
      sessions_limit: isFreeUser ? FREE_TIER_AI_SESSIONS_PER_MONTH : null,
    });
  } catch (error) {
    console.error('Error in POST /api/ai/suggest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
