import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getUserFromRequest } from '@/lib/auth/server-request'

// GET /api/events/[eventId] — event detail + current user's registration status
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const admin = createAdminClient()
    const { eventId } = params

    const { data: event, error } = await admin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    // Check current user's registration status (optional — works even when logged out)
    let registration: Record<string, unknown> | null = null
    const user = await getUserFromRequest(request)
    if (user) {
      const { data: reg } = await admin
        .from('event_registrations')
        .select('id, status, approval_status, application_data, registered_at')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
      registration = reg ?? null
    }

    return NextResponse.json({ success: true, data: event, registration })
  } catch (error) {
    console.error('GET /api/events/[eventId] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// PATCH /api/events/[eventId] — update event (owner organizer or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const admin = createAdminClient()
    const { eventId } = params
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    if (user.role !== 'admin' && event.organizer_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not authorized to edit this event' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = [
      'title', 'description', 'date', 'end_date', 'location',
      'capacity', 'category', 'tags', 'image', 'status',
      'visibility', 'application_question', 'featured',
    ] as const

    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await admin.from('events').update(updates).eq('id', eventId).select('*').single()
    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PATCH /api/events/[eventId] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
