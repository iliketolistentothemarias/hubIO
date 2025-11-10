/**
 * Event Check-in API Route
 * 
 * Handles event check-in for attendees.
 * 
 * Endpoints:
 * - POST /api/events/[id]/checkin - Check in to an event
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * POST /api/events/[id]/checkin
 * 
 * Check in to an event
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
      return NextResponse.json(
        { success: false, error: 'Not registered for this event' },
        { status: 400 }
      )
    }

    // Check if already checked in
    if (registration.status === 'attended') {
      return NextResponse.json(
        { success: false, error: 'Already checked in' },
        { status: 400 }
      )
    }

    // Update registration to attended
    const updated = db.updateEventRegistration(registration.id, {
      status: 'attended',
      checkedInAt: new Date(),
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to check in' },
        { status: 500 }
      )
    }

    // Award karma for attending
    const appUser = db.getUser(user.id)
    if (appUser) {
      db.updateUser(user.id, {
        karma: appUser.karma + 5, // 5 karma for attending an event
      })
    }

    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      message: 'Successfully checked in to event',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error checking in:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to check in' },
      { status: 500 }
    )
  }
}

