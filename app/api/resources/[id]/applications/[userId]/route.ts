import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// PATCH /api/resources/[id]/applications/[userId]
// actions: approve | reject | mute | unmute | remove
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId, userId: targetId } = params

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
      const { data: member } = await admin
        .from('resource_members')
        .select('role')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted')
        .in('role', ['owner', 'manager'])
        .maybeSingle()
      if (!member) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    const { action } = await request.json()
    const validActions = ['approve', 'reject', 'mute', 'unmute', 'remove']
    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, error: `action must be one of: ${validActions.join(', ')}` }, { status: 400 })
    }

    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error } = await admin
        .from('resource_signups')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('resource_id', resourceId)
        .eq('user_id', targetId)
      if (error) throw error

      try {
        await admin.from('notifications').insert({
          user_id: targetId,
          type: action === 'approve' ? 'success' : 'info',
          title: action === 'approve'
            ? `You've been approved for "${resource.name}"!`
            : `Application update for "${resource.name}"`,
          message: action === 'approve'
            ? `You can now access the chat and member community for this resource.`
            : `Your application was not approved at this time.`,
          read: false,
        })
      } catch { /* non-critical */ }

      return NextResponse.json({ success: true, message: `Application ${newStatus}` })
    }

    if (action === 'mute' || action === 'unmute') {
      const { error } = await admin
        .from('resource_signups')
        .update({ muted_from_chat: action === 'mute', updated_at: new Date().toISOString() })
        .eq('resource_id', resourceId)
        .eq('user_id', targetId)
      if (error) throw error
      return NextResponse.json({ success: true, message: `Member ${action === 'mute' ? 'muted' : 'unmuted'}` })
    }

    if (action === 'remove') {
      const { error } = await admin
        .from('resource_signups')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('resource_id', resourceId)
        .eq('user_id', targetId)
      if (error) throw error

      try {
        await admin.from('notifications').insert({
          user_id: targetId,
          type: 'info',
          title: `Removed from "${resource.name}"`,
          message: `You have been removed from this resource by the organizer.`,
          read: false,
        })
      } catch { /* non-critical */ }

      return NextResponse.json({ success: true, message: 'Member removed' })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/resources/[id]/applications/[userId] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
