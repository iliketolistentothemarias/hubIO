import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// POST /api/events/[eventId]/join
// Public event  → registration with approval_status:'approved' immediately
// Private event → registration with approval_status:'pending' + application_data
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { eventId } = params

    const { data: event, error: eventErr } = await admin
      .from('events')
      .select('id, title, visibility, application_question, organizer_id, capacity, attendees, status')
      .eq('id', eventId)
      .single()

    if (eventErr || !event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    if (event.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'This event has been cancelled' }, { status: 400 })
    }

    // Check capacity
    if (event.capacity && event.attendees >= event.capacity) {
      return NextResponse.json({ success: false, error: 'This event is at full capacity' }, { status: 400 })
    }

    // Check if already registered
    const { data: existing } = await admin
      .from('event_registrations')
      .select('id, approval_status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: existing.approval_status === 'rejected'
            ? 'Your application was not accepted'
            : 'You are already registered for this event',
          approval_status: existing.approval_status,
        },
        { status: 409 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const isPrivate = event.visibility === 'private'

    // For private events, require application data
    if (isPrivate) {
      const { name, email, phone, skills_answer } = body
      if (!name || !email || !skills_answer) {
        return NextResponse.json(
          { success: false, error: 'name, email, and skills_answer are required for private events' },
          { status: 400 }
        )
      }
    }

    const approvalStatus = isPrivate ? 'pending' : 'approved'
    const applicationData = isPrivate
      ? {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          skills_answer: body.skills_answer,
        }
      : null

    const { data: registration, error: regErr } = await admin
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: user.id,
        name: body.name || user.name || '',
        email: body.email || user.email || '',
        phone: body.phone || null,
        status: 'registered',
        approval_status: approvalStatus,
        application_data: applicationData,
        registered_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (regErr) throw regErr

    // For public events, increment attendee count
    if (!isPrivate) {
      await admin
        .from('events')
        .update({ attendees: (event.attendees || 0) + 1 })
        .eq('id', eventId)
    }

    // Notify the organizer of new application for private events
    if (isPrivate && event.organizer_id) {
      await admin.from('notifications').insert({
        user_id: event.organizer_id,
        type: 'info',
        title: 'New event application',
        message: `${user.name || user.email} has applied to join "${event.title}"`,
        read: false,
      })
    }

    return NextResponse.json({
      success: true,
      data: registration,
      message: isPrivate
        ? 'Application submitted — you will be notified once reviewed'
        : 'You have joined the event!',
    })
  } catch (error) {
    console.error('POST /api/events/[eventId]/join error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
