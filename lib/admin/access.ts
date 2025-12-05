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

  // Verify admin role
  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    const err = new Error('User profile not found')
    ;(err as any).status = 401
    throw err
  }

  if (profile.role !== 'admin') {
    const err = new Error('Admin access required')
    ;(err as any).status = 403
    throw err
  }

  return { adminId: profile.id }
}

