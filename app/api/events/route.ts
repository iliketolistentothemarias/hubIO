import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromRequest, requireRoleFromRequest } from '@/lib/auth/server-request'

// GET /api/events — list events from Supabase
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'upcoming'
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100)

    let query = admin
      .from('events')
      .select('id, title, description, date, end_date, location, organizer, organizer_id, capacity, attendees, category, tags, image, status, featured, visibility, application_question, created_at')
      .order('date', { ascending: true })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('GET /api/events error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/events — create a new event (organizer or admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRoleFromRequest(request, 'organizer')
    const body = await request.json()

    const {
      title, description, date, end_date, location,
      capacity, category, tags, image,
      visibility = 'public', application_question,
    } = body

    if (!title || !description || !date || !location || !category) {
      return NextResponse.json(
        { success: false, error: 'title, description, date, location, and category are required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('events')
      .insert({
        title,
        description,
        date,
        end_date: end_date || null,
        location,
        organizer: user.name || user.email,
        organizer_id: user.id,
        capacity: capacity || null,
        attendees: 0,
        category,
        tags: tags || [],
        image: image || null,
        status: 'upcoming',
        featured: false,
        visibility,
        application_question: visibility === 'private' ? (application_question || null) : null,
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/events error:', error)
    const status = (error as any)?.status || 500
    return NextResponse.json({ success: false, error: (error as Error).message }, { status })
  }
}
