import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// GET /api/admin/users — list all registered users (merges auth.users + public.users)
export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request)
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || ''

    // Fetch all auth users (up to 1000) so volunteers without profiles still appear
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (authError) throw authError
    const authUsers = authData?.users || []

    // Fetch all public profiles
    const { data: profiles } = await admin
      .from('users')
      .select('id, name, email, role, created_at, avatar')

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    // Merge: public.users data wins; fall back to auth metadata for missing profiles
    const merged = authUsers.map((authUser) => {
      const profile = profileMap.get(authUser.id)
      return {
        id: authUser.id,
        email: profile?.email || authUser.email || '',
        name: profile?.name || (authUser.user_metadata?.name as string) || (authUser.email?.split('@')[0] ?? 'Unknown'),
        role: (profile?.role as string) || 'volunteer',
        created_at: profile?.created_at || authUser.created_at,
        avatar: profile?.avatar || null,
      }
    })

    // Apply search filter
    const filtered = search
      ? merged.filter(
          (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()),
        )
      : merged

    // Sort newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
