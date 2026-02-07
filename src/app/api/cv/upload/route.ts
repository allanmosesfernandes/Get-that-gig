import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase/server';
import { parseCV } from '@/lib/cv-parser';
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from '@/lib/validators/cv';

// Required for pdf-parse to work (needs Node.js runtime)
export const runtime = 'nodejs';

export async function POST(request: Request) {
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

    // TODO: Re-enable CV limit for free tier
    // if (user.subscription_tier === 'free') {
    //   const { count, error: countError } = await supabaseAdmin
    //     .from('cvs')
    //     .select('*', { count: 'exact', head: true })
    //     .eq('user_id', user.id);

    //   if (countError) {
    //     console.error('Error checking CV count:', countError);
    //     return NextResponse.json(
    //       { error: 'Failed to check CV limit' },
    //       { status: 500 }
    //     );
    //   }

    //   if (count !== null && count >= 1) {
    //     return NextResponse.json(
    //       { error: 'CV limit reached. Upgrade to upload more CVs.' },
    //       { status: 403 }
    //     );
    //   }
    // }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || 'My CV';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File must be under 5MB' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Determine file type
    const fileType = fileName.endsWith('.pdf') ? 'pdf' : 'docx';

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('cv-uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Parse the CV
    const { parsed, success } = await parseCV(buffer, fileType);

    // Check if this is the first CV (make it primary)
    const { count: existingCount } = await supabaseAdmin
      .from('cvs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const isPrimary = existingCount === 0;

    // Create CV record in database
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .insert({
        user_id: user.id,
        title,
        original_file_url: storagePath,
        original_filename: file.name,
        file_type: fileType,
        parsed_content: parsed,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (cvError) {
      console.error('Error creating CV record:', cvError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from('cv-uploads').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save CV' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cv,
      parsing_success: success,
      message: success
        ? 'CV uploaded and parsed successfully'
        : 'CV uploaded but parsing failed. You can edit the content manually.',
    });
  } catch (error) {
    console.error('Error in POST /api/cv/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
