import { NextRequest } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function ensureAdmin(request: NextRequest) {
  const adminClient = createAdminClient()
  let userId: string | null = null

  // Try Bearer token first (from frontend fetch calls)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    try {
      const { data, error } = await adminClient.auth.getUser(token)
      if (!error && data.user) {
        userId = data.user.id
      }
    } catch (err) {
      console.error('Bearer token verification failed:', err)
    }
  }

  // Fallback to cookie-based session
  if (!userId) {
    try {
      const serverSupabase = createServerClient({ headers: request.headers })
      const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
      if (!authError && user) {
        userId = user.id
      }
    } catch (err) {
      console.error('Cookie session verification failed:', err)
    }
  }

  if (!userId) {
    const err = new Error('Authentication required')
    ;(err as any).status = 401
    throw err
  }

  // Verify admin role - try to get profile, create if missing
  let { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('id, role, email, name')
    .eq('id', userId)
    .single()

  // If profile doesn't exist, try to create it using admin client (bypasses RLS)
  if (profileError || !profile) {
    console.log('Profile not found, attempting to create user profile...')
    
    // Get user email from the session
    let userEmail = 'user@example.com'
    let userName = 'User'
    
    try {
      // Get user info from the server client (has session context)
      const serverSupabase = createServerClient({ headers: request.headers })
      const { data: { user } } = await serverSupabase.auth.getUser()
      if (user) {
        userEmail = user.email || userEmail
        userName = user.user_metadata?.name || 
                   user.user_metadata?.full_name || 
                   user.email?.split('@')[0] || userName
      }
    } catch (err) {
      console.warn('Could not get user info from session:', err)
    }
    
    // Try to create profile using admin client (should bypass RLS if service role key is set)
    const { error: insertError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        name: userName,
        role: 'volunteer',
        karma: 0,
        resources_count: 0,
        volunteer_hours: 0,
        funds_raised: 0,
        events_count: 0,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to create user profile:', insertError)
      // If insert fails, try to fetch again in case trigger created it
      const { data: retryProfile } = await adminClient
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single()
      
      if (!retryProfile) {
        const err = new Error('User profile not found. Please sign out and sign in again to create your profile.')
        ;(err as any).status = 401
        throw err
      }
      profile = retryProfile
    } else {
      // Fetch the newly created profile
      const { data: newProfile, error: fetchError } = await adminClient
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single()

      if (fetchError || !newProfile) {
        console.error('Failed to fetch newly created profile:', fetchError)
        const err = new Error('User profile not found')
        ;(err as any).status = 401
        throw err
      }

      profile = newProfile
    }
  }

  if (profile.role !== 'admin') {
    const err = new Error('Admin access required')
    ;(err as any).status = 403
    throw err
  }

  return { adminId: profile.id }
}

