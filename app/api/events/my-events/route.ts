/**
 * My Events API Route
 * 
 * Get events that the current user has registered/RSVPed for.
 * 
 * Endpoints:
 * - GET /api/events/my-events - Get user's registered events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Event, PaginatedResponse } from '@/lib/types'

const supabaseDb = getSupabaseDatabase()
const db = getDatabase()

/**
 * GET /api/events/my-events
 * 
 * Get events that the current user has registered for
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') || 'upcoming' // upcoming, past, all

    // Get user's event registrations
    let registrations
    try {
      registrations = await supabaseDb.getEventRegistrationsByUser(user.id)
    } catch (error) {
      registrations = db.getEventRegistrationsByUser(user.id)
    }

    // Get events for these registrations
    const eventIds = registrations.map(reg => reg.eventId)
    if (eventIds.length === 0) {
      const response: ApiResponse<PaginatedResponse<Event>> = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
      }
      return NextResponse.json(response)
    }

    // Fetch events
    let allEvents: Event[] = []
    try {
      // Try to get all events from Supabase and filter
      const allEventsFromDb = await supabaseDb.getAllEvents()
      allEvents = allEventsFromDb.filter(e => eventIds.includes(e.id))
    } catch (error) {
      // Fallback to in-memory database
      const allEventsFromDb = Array.from((db as any).db.events.values()) as Event[]
      allEvents = allEventsFromDb.filter(e => eventIds.includes(e.id))
    }

    // Filter by status
    const now = new Date()
    if (status === 'upcoming') {
      allEvents = allEvents.filter(e => e.date >= now && (e.status === 'upcoming' || e.status === 'ongoing'))
    } else if (status === 'past') {
      allEvents = allEvents.filter(e => e.date < now || e.status === 'completed' || e.status === 'cancelled')
    }

    // Sort by date
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Pagination
    const total = allEvents.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedEvents = allEvents.slice(startIndex, startIndex + pageSize)

    // Add registration status to events
    const eventsWithRegistration = paginatedEvents.map(event => {
      const registration = registrations.find(reg => reg.eventId === event.id)
      return {
        ...event,
        registrationStatus: registration?.status || 'registered',
        registeredAt: registration?.registeredAt,
      }
    })

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        items: eventsWithRegistration,
        total,
        page,
        pageSize,
        totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching my events:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

