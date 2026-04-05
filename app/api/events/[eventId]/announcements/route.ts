import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// Verify the requester is an approved participant or the event organizer
async function verifyAccess(eventId: string, userId: string, userRole: string): Promise<boolean> {
  const admin = createAdminClient()

  // Check if organizer
  const { data: event } = await admin
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()
  if (!event) return false
  if (event.organizer_id === userId || userRole === 'admin') return true

  // Check approved registration
  const { data: reg } = await admin
    .from('event_registrations')
    .select('approval_status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single()

  return reg?.approval_status === 'approved'
}

// GET /api/events/[eventId]/announcements — fetch messages
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { eventId } = params

    const hasAccess = await verifyAccess(eventId, user.id, user.role)
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Access denied — join the event first' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || '80'), 200)
    const before = searchParams.get('before')

    let query = admin
      .from('event_announcements')
      .select(`
        id,
        event_id,
        user_id,
        content,
        created_at,
        users:user_id (id, name, avatar)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query
    if (error) throw error

    // Return in ascending order for the UI
    return NextResponse.json({ success: true, data: (data || []).reverse() })
  } catch (error) {
    console.error('GET /api/events/[eventId]/announcements error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/events/[eventId]/announcements — post a message
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { eventId } = params

    const hasAccess = await verifyAccess(eventId, user.id, user.role)
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('event_announcements')
      .insert({ event_id: eventId, user_id: user.id, content: content.trim() })
      .select(`id, event_id, user_id, content, created_at, users:user_id (id, name, avatar)`)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/events/[eventId]/announcements error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
