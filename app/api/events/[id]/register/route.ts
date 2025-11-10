/**
 * Event Registration API Route
 * 
 * Handles event registration operations (similar to RSVP but for non-RSVP events).
 * 
 * Endpoints:
 * - POST /api/events/[id]/register - Register for an event
 * - DELETE /api/events/[id]/register - Cancel registration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, EventRegistration } from '@/lib/types'

const supabaseDb = getSupabaseDatabase()
const db = getDatabase()

/**
 * POST /api/events/[id]/register
 * 
 * Register for an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get event
    let event
    try {
      event = await supabaseDb.getEventById(eventId)
    } catch (error) {
      event = db.getEvent(eventId)
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check capacity
    if (event.capacity && event.registered >= event.capacity) {
      return NextResponse.json(
        { success: false, error: 'Event is at full capacity' },
        { status: 400 }
      )
    }

    // Check if already registered
    try {
      const existing = await supabaseDb.getEventRegistration(eventId, user.id)
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Already registered for this event' },
          { status: 400 }
        )
      }
    } catch (error) {
      const existing = db.getEventRegistration(eventId, user.id)
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Already registered for this event' },
          { status: 400 }
        )
      }
    }

    // Create registration
    const registration: Omit<EventRegistration, 'id'> = {
      eventId,
      userId: user.id,
      status: 'registered',
      registeredAt: new Date(),
    }

    let created: EventRegistration
    try {
      created = await supabaseDb.createEventRegistration(registration)
      await supabaseDb.updateEvent(eventId, {
        registered: event.registered + 1,
      })
    } catch (error) {
      created = db.createEventRegistration({
        ...registration,
        id: `reg_${Date.now()}`,
      })
      const updatedEvent = {
        ...event,
        registered: event.registered + 1,
        updatedAt: new Date(),
      }
      db.createEvent(updatedEvent)
    }

    const response: ApiResponse<EventRegistration> = {
      success: true,
      data: created,
      message: 'Successfully registered for event',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error registering for event:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to register for event' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/events/[id]/register
 * 
 * Cancel registration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const eventId = params.id

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get event
    let event
    try {
      event = await supabaseDb.getEventById(eventId)
    } catch (error) {
      event = db.getEvent(eventId)
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Delete registration
    try {
      const deleted = await supabaseDb.deleteEventRegistration(eventId, user.id)
      if (deleted) {
        await supabaseDb.updateEvent(eventId, {
          registered: Math.max(0, event.registered - 1),
        })
      }
    } catch (error) {
      const deleted = db.deleteEventRegistration(eventId, user.id)
      if (deleted) {
        const updatedEvent = {
          ...event,
          registered: Math.max(0, event.registered - 1),
          updatedAt: new Date(),
        }
        db.createEvent(updatedEvent)
      }
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Registration cancelled successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error cancelling registration:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to cancel registration' },
      { status: 500 }
    )
  }
}

