import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase/server';

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

    // Get or create user in Supabase
    const { user, error: userError } = await getOrCreateUser(userId);

    if (userError || !user) {
      return NextResponse.json({ error: userError || 'User not found' }, { status: 404 });
    }

    // Get the CV (verify ownership)
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('original_file_url, original_filename, file_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    if (!cv.original_file_url) {
      return NextResponse.json(
        { error: 'No original file available' },
        { status: 404 }
      );
    }

    // Generate a signed URL for viewing (valid for 1 hour)
    const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
      .from('cv-uploads')
      .createSignedUrl(cv.original_file_url, 3600);

    if (signedUrlError || !signedUrl) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate view link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl.signedUrl,
      filename: cv.original_filename,
      fileType: cv.file_type,
    });
  } catch (error) {
    console.error('Error in GET /api/cv/[id]/view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
