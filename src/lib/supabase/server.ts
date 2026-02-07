import { createClient } from '@supabase/supabase-js'
import { currentUser } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Get or create a user in Supabase based on Clerk user ID.
 * This handles cases where the webhook hasn't synced the user yet.
 */
export async function getOrCreateUser(clerkUserId: string) {
  // First try to find existing user
  const { data: existingUser, error: findError } = await supabaseAdmin
    .from('users')
    .select('id, subscription_tier')
    .eq('clerk_id', clerkUserId)
    .single()

  if (existingUser) {
    return { user: existingUser, error: null }
  }

  // User doesn't exist, create them
  if (findError && findError.code === 'PGRST116') {
    // Get user info from Clerk
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return { user: null, error: 'Could not fetch user from Clerk' }
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: clerkUserId,
        email: email,
        full_name: fullName,
      })
      .select('id, subscription_tier')
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return { user: null, error: 'Failed to create user' }
    }

    return { user: newUser, error: null }
  }

  console.error('Error finding user:', findError)
  return { user: null, error: 'Failed to find user' }
}
