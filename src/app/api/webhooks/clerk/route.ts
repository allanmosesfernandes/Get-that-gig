import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook
  const wh = new Webhook(webhookSecret)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }

  // Handle the event
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    const email = email_addresses[0]?.email_address
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || null

    // Upsert user to Supabase
    const { error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          clerk_id: id,
          email: email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )

    if (error) {
      console.error('Error upserting user:', error)
      return new Response('Error syncing user', { status: 500 })
    }

    console.log(`User ${eventType === 'user.created' ? 'created' : 'updated'}:`, id)
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (id) {
      const { error } = await supabaseAdmin.from('users').delete().eq('clerk_id', id)

      if (error) {
        console.error('Error deleting user:', error)
        return new Response('Error deleting user', { status: 500 })
      }

      console.log('User deleted:', id)
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
