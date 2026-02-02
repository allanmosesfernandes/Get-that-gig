import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cvUpdateSchema } from '@/lib/validators/cv';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's internal ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the CV
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    return NextResponse.json({ cv });
  } catch (error) {
    console.error('Error in GET /api/cv/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's internal ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify CV ownership
    const { data: existingCv, error: existingError } = await supabaseAdmin
      .from('cvs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingCv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = cvUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If setting this CV as primary, unset others first
    if (updates.is_primary === true) {
      await supabaseAdmin
        .from('cvs')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('id', id);
    }

    // Update the CV
    const { data: cv, error: updateError } = await supabaseAdmin
      .from('cvs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating CV:', updateError);
      return NextResponse.json(
        { error: 'Failed to update CV' },
        { status: 500 }
      );
    }

    return NextResponse.json({ cv });
  } catch (error) {
    console.error('Error in PATCH /api/cv/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's internal ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the CV to delete (and verify ownership)
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    // Delete file from storage if it exists
    if (cv.original_file_url) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('cv-uploads')
        .remove([cv.original_file_url]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with deletion even if storage cleanup fails
      }
    }

    // Delete the CV record
    const { error: deleteError } = await supabaseAdmin
      .from('cvs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting CV:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete CV' },
        { status: 500 }
      );
    }

    // If deleted CV was primary, make the newest CV primary
    if (cv.is_primary) {
      const { data: newestCv } = await supabaseAdmin
        .from('cvs')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (newestCv) {
        await supabaseAdmin
          .from('cvs')
          .update({ is_primary: true })
          .eq('id', newestCv.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/cv/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
