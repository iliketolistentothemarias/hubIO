/**
 * Admin Events API
 * 
 * Manage events (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/admin/events
 * 
 * Get all events (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Try to use admin client if available
    let client = supabase
    try {
      const adminClient = createAdminClient()
      client = adminClient
    } catch (error) {
      console.warn('Admin client not available, using regular client')
    }

    // Get all events
    const { data: events, error: eventsError } = await client
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (eventsError) {
      // Return empty array if table doesn't exist
      if (eventsError.code === 'PGRST204' || eventsError.message?.includes('relation') || eventsError.message?.includes('schema cache')) {
        return NextResponse.json(
          { success: true, data: [] },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      data: events || [],
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/events
 * 
 * Delete an event (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Try to use admin client if available
    let client = supabase
    try {
      const adminClient = createAdminClient()
      client = adminClient
    } catch (error) {
      console.warn('Admin client not available, using regular client')
    }

    // Delete event
    const { error: deleteError } = await client
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}

