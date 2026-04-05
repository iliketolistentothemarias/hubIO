import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// Verify the requester is an owner/member or approved signup
async function verifyAccess(resourceId: string, userId: string, userRole: string): Promise<boolean> {
  const admin = createAdminClient()
  if (userRole === 'admin') return true

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
      .select('id, resource_id, user_id, content, created_at, users:user_id (id, name, avatar)')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: (data || []).reverse() })
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

    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('resource_announcements')
      .insert({ resource_id: resourceId, user_id: user.id, content: content.trim() })
      .select('id, resource_id, user_id, content, created_at, users:user_id (id, name, avatar)')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/resources/[id]/announcements error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
