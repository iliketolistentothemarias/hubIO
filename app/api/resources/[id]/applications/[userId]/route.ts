import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// PATCH /api/resources/[id]/applications/[userId] — approve or reject signup
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId, userId: applicantId } = params

    // Only owner/manager or admin can approve/reject
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
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be approve or reject' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { error } = await admin
      .from('resource_signups')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('resource_id', resourceId)
      .eq('user_id', applicantId)

    if (error) throw error

    // Notify the applicant
    try {
      await admin.from('notifications').insert({
        user_id: applicantId,
        type: action === 'approve' ? 'success' : 'info',
        title: action === 'approve'
          ? `You've been approved for "${resource.name}"!`
          : `Application update for "${resource.name}"`,
        message: action === 'approve'
          ? `You can now access the announcements and chat for this resource.`
          : `Your application was not approved at this time.`,
        read: false,
      })
    } catch (notifErr) {
      console.error('Failed to send application notification:', notifErr)
    }

    return NextResponse.json({ success: true, message: `Application ${newStatus}` })
  } catch (error) {
    console.error('PATCH /api/resources/[id]/applications/[userId] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
