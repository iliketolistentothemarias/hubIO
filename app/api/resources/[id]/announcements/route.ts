import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// Verify the requester is an owner/member or approved signup
async function verifyAccess(resourceId: string, userId: string, userRole: string): Promise<boolean> {
  const admin = createAdminClient()
  if (userRole === 'admin') return true

  // Check resource submitter (owner via resources table)
  const { data: resource } = await admin
    .from('resources')
    .select('submitted_by')
    .eq('id', resourceId)
    .single()
  if (resource?.submitted_by === userId) return true

  // Check owner/manager via resource_members
  const { data: member } = await admin
    .from('resource_members')
    .select('id')
    .eq('resource_id', resourceId)
    .eq('user_id', userId)
    .eq('invitation_status', 'accepted')
    .maybeSingle()
  if (member) return true

  // Check approved signup
  const { data: signup } = await admin
    .from('resource_signups')
    .select('id')
    .eq('resource_id', resourceId)
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle()
  return !!signup
}

// GET /api/resources/[id]/announcements
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId } = params

    const hasAccess = await verifyAccess(resourceId, user.id, user.role)
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Access denied — join the resource first' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || '80'), 200)
    const before = searchParams.get('before')

    let query = admin
      .from('resource_announcements')
      .select('id, resource_id, user_id, content, created_at')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) throw error

    // Enrich with user profiles
    const rows = data || []
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const { data: profiles } = await admin
      .from('users')
      .select('id, name, avatar')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
    const enriched = rows.map((r) => ({
      ...r,
      users: profileMap.get(r.user_id) || null,
    }))

    return NextResponse.json({ success: true, data: enriched.reverse() })
  } catch (error) {
    console.error('GET /api/resources/[id]/announcements error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/resources/[id]/announcements
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId } = params

    const hasAccess = await verifyAccess(resourceId, user.id, user.role)
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Block muted users from posting (ignore errors if column doesn't exist yet)
    try {
      const { data: signup } = await admin
        .from('resource_signups')
        .select('muted_from_chat')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (signup?.muted_from_chat) {
        return NextResponse.json({ success: false, error: 'You have been muted from this chat' }, { status: 403 })
      }
    } catch {
      // muted_from_chat column may not exist yet — allow post
    }

    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
    }

    // Ensure user has a public.users profile (creates one if the signup trigger was never applied)
    const { data: existingProfile } = await admin
      .from('users')
      .select('id, name, avatar')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      const { data: authUser } = await admin.auth.admin.getUserById(user.id)
      if (authUser?.user) {
        const au = authUser.user
        await admin.from('users').insert({
          id: au.id,
          email: au.email || '',
          name: (au.user_metadata?.name as string) || au.email?.split('@')[0] || 'Unknown',
          role: 'volunteer',
        })
      }
    }

    // Insert the message (no FK join — fetch user separately to avoid PostgREST relationship errors)
    const { data: inserted, error: insertError } = await admin
      .from('resource_announcements')
      .insert({ resource_id: resourceId, user_id: user.id, content: content.trim() })
      .select('id, resource_id, user_id, content, created_at')
      .single()

    if (insertError) throw insertError

    // Fetch fresh user profile for the response
    const { data: profile } = await admin
      .from('users')
      .select('id, name, avatar')
      .eq('id', user.id)
      .maybeSingle()

    const data = {
      ...inserted,
      users: profile || { id: user.id, name: user.name, avatar: user.avatar ?? null },
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/resources/[id]/announcements error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
