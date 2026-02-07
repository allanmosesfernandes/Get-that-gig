import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase/server';

export async function GET() {
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

    // Get the primary CV for the user (or most recent if no primary)
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cvError && cvError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine (no CV yet)
      console.error('Error fetching CV:', cvError);
      return NextResponse.json(
        { error: 'Failed to fetch CV' },
        { status: 500 }
      );
    }

    return NextResponse.json({ cv: cv || null });
  } catch (error) {
    console.error('Error in GET /api/cv:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
