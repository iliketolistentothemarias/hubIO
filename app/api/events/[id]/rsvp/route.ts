/**
 * Event RSVP API Route
 * 
 * Handles RSVP operations for events with waitlist support.
 * 
 * Endpoints:
 * - POST /api/events/[id]/rsvp - RSVP to an event
 * - DELETE /api/events/[id]/rsvp - Cancel RSVP
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, EventRegistration } from '@/lib/types'

const db = getDatabase()

/**
 * POST /api/events/[id]/rsvp
 * 
 * RSVP to an event (with waitlist support)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const eventId = params.id
    const body = await request.json()
    const { addToCalendar } = body || {}

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Get event
    const event = db.getEvent(eventId)
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if event is RSVP required
    if (!event.rsvpRequired) {
      return NextResponse.json(
        { success: false, error: 'This event does not require RSVP' },
        { status: 400 }
      )
    }

    // Check if already registered or on waitlist
    const existing = db.getEventRegistration(eventId, user.id)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // Check waitlist
    const waitlist = db.getWaitlistByEvent(eventId)
    const onWaitlist = waitlist.some(reg => reg.userId === user.id)
    if (onWaitlist) {
      return NextResponse.json(
        { success: false, error: 'Already on waitlist for this event' },
        { status: 400 }
      )
    }

    // Check capacity
    const isFull = event.capacity && event.registered >= event.capacity

    if (isFull) {
      // Add to waitlist
      const waitlistRegistration: EventRegistration = {
        id: `waitlist_${Date.now()}_${user.id}`,
        eventId,
        userId: user.id,
        status: 'waitlist',
        registeredAt: new Date(),
      }

      db.addToWaitlist(waitlistRegistration)

      const response: ApiResponse<EventRegistration> = {
        success: true,
        data: waitlistRegistration,
        message: 'Event is full. You have been added to the waitlist.',
      }

      return NextResponse.json(response, { status: 201 })
    }

    // Create registration
    const registration: EventRegistration = {
      id: `reg_${Date.now()}_${user.id}`,
      eventId,
      userId: user.id,
      status: 'registered',
      registeredAt: new Date(),
      calendarAdded: addToCalendar || false,
    }

    db.createEventRegistration(registration)

    // Update event registered count
    const updatedEvent = {
      ...event,
      registered: event.registered + 1,
      updatedAt: new Date(),
    }
    db.createEvent(updatedEvent)

    // TODO: Send confirmation email with calendar link
    // TODO: Add to user's calendar if requested

    const response: ApiResponse<EventRegistration> = {
      success: true,
      data: registration,
      message: 'Successfully RSVPed to event',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating RSVP:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to RSVP to event' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/events/[id]/rsvp
 * 
 * Cancel RSVP
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
    const event = db.getEvent(eventId)
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if registered
    const registration = db.getEventRegistration(eventId, user.id)
    if (!registration) {
      // Check waitlist
      const removed = db.removeFromWaitlist(eventId, user.id)
      if (removed) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Removed from waitlist successfully',
        })
      }
      return NextResponse.json(
        { success: false, error: 'Not registered for this event' },
        { status: 404 }
      )
    }

    // Delete registration
    const deleted = db.deleteEventRegistration(eventId, user.id)
    if (deleted) {
      // Update event registered count
      const updatedEvent = {
        ...event,
        registered: Math.max(0, event.registered - 1),
        updatedAt: new Date(),
      }
      db.createEvent(updatedEvent)

      // Promote someone from waitlist if available
      const promoted = db.promoteFromWaitlist(eventId)
      if (promoted) {
        // Update event count again
        const finalEvent = {
          ...updatedEvent,
          registered: updatedEvent.registered + 1,
        }
        db.createEvent(finalEvent)

        // TODO: Notify promoted user
      }
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'RSVP cancelled successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error cancelling RSVP:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to cancel RSVP' },
      { status: 500 }
    )
  }
}
