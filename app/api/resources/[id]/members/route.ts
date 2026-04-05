import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// GET /api/resources/[id]/members — list all approved members (owner + approved signups)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId } = params

    // Verify requester has access (owner, manager, or approved member)
    const { data: resource } = await admin
      .from('resources')
      .select('submitted_by, name')
      .eq('id', resourceId)
      .single()

    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
    }

    const isOwner = resource.submitted_by === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      // Check if they are an approved member themselves
      const { data: memberCheck } = await admin
        .from('resource_signups')
        .select('id')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle()

      const { data: ownerCheck } = await admin
        .from('resource_members')
        .select('id')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted')
        .maybeSingle()

      if (!memberCheck && !ownerCheck) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Fetch approved signups (regular members)
    const { data: signups, error: signupErr } = await admin
      .from('resource_signups')
      .select('id, user_id, status, muted_from_chat, created_at, users:user_id (id, name, email, avatar)')
      .eq('resource_id', resourceId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (signupErr) throw signupErr

    // Fetch resource owners/managers
    const { data: owners, error: ownerErr } = await admin
      .from('resource_members')
      .select('id, user_id, role, created_at, users:user_id (id, name, email, avatar)')
      .eq('resource_id', resourceId)
      .eq('invitation_status', 'accepted')
      .order('created_at', { ascending: true })

    if (ownerErr) throw ownerErr

    // Merge into a unified list, marking owners and their mute status
    const ownerIds = new Set((owners || []).map((o: any) => o.user_id))

    const members = [
      ...(owners || []).map((o: any) => ({
        user_id: o.user_id,
        name: o.users?.name || 'Unknown',
        email: o.users?.email || '',
        avatar: o.users?.avatar || null,
        role: o.role as string,
        muted_from_chat: false,
        joined_at: o.created_at,
        signup_id: null as string | null,
        is_owner: true,
      })),
      ...(signups || [])
        .filter((s: any) => !ownerIds.has(s.user_id))
        .map((s: any) => ({
          user_id: s.user_id,
          name: s.users?.name || 'Unknown',
          email: s.users?.email || '',
          avatar: s.users?.avatar || null,
          role: 'member',
          muted_from_chat: s.muted_from_chat,
          joined_at: s.created_at,
          signup_id: s.id,
          is_owner: false,
        })),
    ]

    return NextResponse.json({
      success: true,
      data: members,
      meta: { isOwner: isOwner || isAdmin, resourceName: resource.name },
    })
  } catch (error) {
    console.error('GET /api/resources/[id]/members error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
