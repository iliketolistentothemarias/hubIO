import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// GET /api/events/[eventId]/applications
// Returns pending applications for the organizer of this event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { eventId } = params

    // Verify requester is the event organizer or admin
    const { data: event } = await admin.from('events').select('organizer_id, title').eq('id', eventId).single()
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }
    if (user.role !== 'admin' && event.organizer_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const approvalStatus = searchParams.get('approval_status') || 'pending'

    const { data, error } = await admin
      .from('event_registrations')
      .select('id, user_id, name, email, phone, status, approval_status, application_data, registered_at')
      .eq('event_id', eventId)
      .eq('approval_status', approvalStatus)
      .order('registered_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [], event_title: event.title })
  } catch (error) {
    console.error('GET /api/events/[eventId]/applications error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
