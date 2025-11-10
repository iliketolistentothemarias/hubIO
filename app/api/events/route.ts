/**
 * Events API Route
 * 
 * Handles CRUD operations for community events.
 * 
 * Endpoints:
 * - GET /api/events - Get all events (with optional filtering)
 * - POST /api/events - Create new event (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Event, PaginatedResponse } from '@/lib/types'
import { events as seedEvents } from '@/data/events'

const db = getDatabase()
const supabaseDb = getSupabaseDatabase()

/**
 * GET /api/events
 * 
 * Get all events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'upcoming'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Try to get events from Supabase first, fallback to in-memory database, then seed data
    let allEvents: Event[] = []
    
    try {
      allEvents = await supabaseDb.getAllEvents()
    } catch (error) {
      console.warn('Supabase events not available, trying in-memory database')
      try {
        // Get all events from in-memory database
        const dbEvents = Array.from((db as any).db.events.values()) as Event[]
        if (dbEvents.length > 0) {
          allEvents = dbEvents
        } else {
          // If no events in database, use seed data
          allEvents = seedEvents
        }
      } catch (error2) {
        console.warn('In-memory database not available, using seed data')
        allEvents = seedEvents
      }
    }

    // If no events from database, use seed data
    if (allEvents.length === 0) {
      allEvents = seedEvents
    }

    // Filter by status
    if (status !== 'all') {
      if (status === 'upcoming') {
        allEvents = allEvents.filter(e => e.status === 'upcoming' || e.status === 'ongoing')
      } else if (status === 'past') {
        allEvents = allEvents.filter(e => e.status === 'completed' || e.status === 'cancelled')
      } else {
        allEvents = allEvents.filter(e => e.status === status)
      }
    }

    // Filter by category
    if (category && category !== 'All') {
      allEvents = allEvents.filter(e => e.category === category)
    }

    // Sort by date (upcoming first)
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Pagination
    const total = allEvents.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedEvents = allEvents.slice(startIndex, startIndex + pageSize)

    const response: ApiResponse<PaginatedResponse<Event>> = {
      success: true,
      data: {
        items: paginatedEvents,
        total,
        page,
        pageSize,
        totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching events:', error)
    // Fallback to seed data
    const response: ApiResponse<PaginatedResponse<Event>> = {
      success: true,
      data: {
        items: seedEvents.slice(0, 20),
        total: seedEvents.length,
        page: 1,
        pageSize: 20,
        totalPages: Math.ceil(seedEvents.length / 20),
      },
    }
    return NextResponse.json(response)
  }
}

/**
 * POST /api/events
 * 
 * Create a new event (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.category || !body.date || !body.time) {
      return NextResponse.json(
        { success: false, error: 'Name, description, category, date, and time are required' },
        { status: 400 }
      )
    }

    // Create event
    const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      description: body.description,
      category: body.category,
      date: new Date(body.date),
      time: body.time,
      location: body.location,
      organizer: user.name || user.email || 'Anonymous',
      organizerId: user.id,
      capacity: body.capacity,
      registered: 0,
      rsvpRequired: body.rsvpRequired || false,
      ticketPrice: body.ticketPrice,
      tags: Array.isArray(body.tags) ? body.tags : [],
      status: 'upcoming',
    }

    // Try to create in Supabase first
    let created: Event
    try {
      created = await supabaseDb.createEvent(eventData)
    } catch (error) {
      // Fallback to in-memory database
      created = db.createEvent({
        ...eventData,
        id: `evt_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    const response: ApiResponse<Event> = {
      success: true,
      data: created,
      message: 'Event created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating event:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

