import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase/server';
import { z } from 'zod';

const updateApplicationSchema = z.object({
  company_name: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  job_url: z.string().url().optional().or(z.literal('')),
  job_description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['applied', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/applications/[id] - Get single application
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, error: userError } = await getOrCreateUser(userId);

    if (userError || !user) {
      return NextResponse.json({ error: userError || 'User not found' }, { status: 404 });
    }

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error in GET /api/applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[id] - Update application
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, error: userError } = await getOrCreateUser(userId);

    if (userError || !user) {
      return NextResponse.json({ error: userError || 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (parsed.data.company_name !== undefined) updates.company_name = parsed.data.company_name;
    if (parsed.data.position !== undefined) updates.position = parsed.data.position;
    if (parsed.data.job_url !== undefined) updates.job_url = parsed.data.job_url || null;
    if (parsed.data.job_description !== undefined) updates.job_description = parsed.data.job_description;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error in PATCH /api/applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, error: userError } = await getOrCreateUser(userId);

    if (userError || !user) {
      return NextResponse.json({ error: userError || 'User not found' }, { status: 404 });
    }

    // Verify ownership and get tailored CV URL for cleanup
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select('tailored_cv_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Delete tailored CV from storage if exists
    if (application.tailored_cv_url) {
      await supabaseAdmin.storage
        .from('tailored-cvs')
        .remove([application.tailored_cv_url]);
    }

    // Delete the application
    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
