import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// PATCH /api/events/[eventId]/applications/[userId]
// Body: { action: 'approve' | 'reject', reason?: string }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; userId: string } }
) {
  try {
    const currentUser = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { eventId, userId } = params

    // Verify requester is the event organizer or admin
    const { data: event } = await admin
      .from('events')
      .select('organizer_id, title, attendees')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }
    if (currentUser.role !== 'admin' && event.organizer_id !== currentUser.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const { action, reason } = await request.json()
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    // Update the registration
    const { data: reg, error: regErr } = await admin
      .from('event_registrations')
      .update({ approval_status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (regErr || !reg) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Increment attendee count on approval
      await admin
        .from('events')
        .update({ attendees: (event.attendees || 0) + 1 })
        .eq('id', eventId)
    }

    // Notify the applicant
    await admin.from('notifications').insert({
      user_id: userId,
      type: action === 'approve' ? 'success' : 'info',
      title: action === 'approve'
        ? `You've been accepted to "${event.title}"!`
        : `Application update for "${event.title}"`,
      message: action === 'approve'
        ? `Your application was approved. You can now access the event page and announcements.`
        : reason
          ? `Your application was not accepted: ${reason}`
          : `Your application was not accepted at this time.`,
      read: false,
    })

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Applicant approved' : 'Applicant rejected',
    })
  } catch (error) {
    console.error('PATCH /api/events/[eventId]/applications/[userId] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
