import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase/server';
import { applySuggestions } from '@/lib/gemini';
import { generatePDF, generateFilename } from '@/lib/pdf-generator';
import { Suggestion } from '@/types/suggestions';
import { z } from 'zod';

// Must use Node.js runtime for PDF generation
export const runtime = 'nodejs';

const requestSchema = z.object({
  session_id: z.string().uuid(),
  cv_id: z.string().uuid(),
  suggestions: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['pending', 'accepted', 'rejected']),
    })
  ),
  create_application: z.boolean().optional().default(false),
  company_name: z.string().optional(),
  position: z.string().optional(),
  job_url: z.string().optional(),
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

    const {
      session_id,
      cv_id,
      suggestions: suggestionStatuses,
      create_application,
      company_name,
      position,
      job_url,
    } = parsed.data;

    // Fetch the original CV
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .eq('user_id', user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    // Fetch the suggestion session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('ai_suggestions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Suggestion session not found' }, { status: 404 });
    }

    // Merge suggestion statuses with stored suggestions
    const storedSuggestions = session.suggestions as Suggestion[];
    const updatedSuggestions = storedSuggestions.map((s) => {
      const statusUpdate = suggestionStatuses.find((ss) => ss.id === s.id);
      return statusUpdate ? { ...s, status: statusUpdate.status } : s;
    });

    // Apply accepted suggestions to the CV
    const tailoredCV = applySuggestions(cv.parsed_content, updatedSuggestions);

    // Generate PDF
    const pdfBuffer = await generatePDF(tailoredCV);

    // Generate filename
    const filename = generateFilename(
      cv.original_filename || 'cv',
      company_name || session.company_name,
      position || session.position
    );

    // Upload to storage
    const storagePath = `${user.id}/${Date.now()}-${filename}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('tailored-cvs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading tailored CV:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload tailored CV' },
        { status: 500 }
      );
    }

    // Get signed URL for download (valid for 1 hour)
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('tailored-cvs')
      .createSignedUrl(storagePath, 3600);

    const downloadUrl = signedUrlData?.signedUrl;

    // Update the suggestion session with final statuses
    await supabaseAdmin
      .from('ai_suggestions')
      .update({ suggestions: updatedSuggestions })
      .eq('id', session_id);

    // Create application record if requested
    let application = null;
    if (create_application) {
      const applicationData = {
        user_id: user.id,
        cv_id,
        company_name: company_name || session.company_name || 'Unknown Company',
        position: position || session.position || 'Unknown Position',
        job_url: job_url || session.job_url || null,
        job_description: session.job_description,
        status: 'applied',
        tailored_cv_url: storagePath,
      };

      const { data: newApplication, error: appError } = await supabaseAdmin
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (appError) {
        console.error('Error creating application:', appError);
        // Don't fail the request, just log the error
      } else {
        application = newApplication;

        // Increment daily applications counter
        await supabaseAdmin
          .from('daily_stats')
          .upsert(
            {
              user_id: user.id,
              date: new Date().toISOString().split('T')[0],
              applications_submitted: 1,
            },
            {
              onConflict: 'user_id,date',
            }
          );

        // Try to increment counter (function might not exist)
        try {
          await supabaseAdmin.rpc('increment_daily_applications', { p_user_id: user.id });
        } catch {
          // Function might not exist, that's okay
        }
      }
    }

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
      storage_path: storagePath,
      filename,
      suggestions_applied: updatedSuggestions.filter((s) => s.status === 'accepted').length,
      application: application,
    });
  } catch (error) {
    console.error('Error in POST /api/ai/apply:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
