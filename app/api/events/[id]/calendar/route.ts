/**
 * Event Calendar Integration API Route
 * 
 * Generates calendar files (iCal) for events.
 * 
 * Endpoints:
 * - GET /api/events/[id]/calendar - Get iCal file for event
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'

const db = getDatabase()

/**
 * GET /api/events/[id]/calendar
 * 
 * Generate iCal file for event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const event = db.getEvent(eventId)

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Generate iCal content
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Default 2 hours

    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const escapeText = (text: string): string => {
      return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n')
    }

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HubIO//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@hubio.org`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${escapeText(event.name)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.location.address)}`,
      `URL:${process.env.NEXT_PUBLIC_APP_URL || 'https://hubio.org'}/events`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    // Return as iCal file
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${event.id}.ics"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating calendar file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate calendar file' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events/[id]/calendar
 * 
 * Add event to user's calendar (Google Calendar, Outlook, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const eventId = params.id
    const body = await request.json()
    const { provider } = body // 'google', 'outlook', 'apple'

    const event = db.getEvent(eventId)
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get or create registration
    let registration = db.getEventRegistration(eventId, user.id)
    if (!registration) {
      registration = {
        id: `reg_${Date.now()}_${user.id}`,
        eventId,
        userId: user.id,
        status: 'registered',
        registeredAt: new Date(),
        calendarAdded: false,
      }
      db.createEventRegistration(registration)
    }

    // Update registration to mark calendar as added
    db.updateEventRegistration(registration.id, {
      calendarAdded: true,
    })

    // Generate calendar URLs based on provider
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

    const formatGoogleCalendar = (): string => {
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.name,
        dates: `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        details: event.description,
        location: event.location.address,
      })
      return `https://calendar.google.com/calendar/render?${params.toString()}`
    }

    const formatOutlookCalendar = (): string => {
      const params = new URLSearchParams({
        subject: event.name,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        body: event.description,
        location: event.location.address,
      })
      return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
    }

    let calendarUrl = ''
    if (provider === 'google') {
      calendarUrl = formatGoogleCalendar()
    } else if (provider === 'outlook') {
      calendarUrl = formatOutlookCalendar()
    } else {
      // Default to Google Calendar
      calendarUrl = formatGoogleCalendar()
    }

    return NextResponse.json({
      success: true,
      data: {
        calendarUrl,
        provider: provider || 'google',
      },
      message: 'Calendar link generated',
    })
  } catch (error: any) {
    console.error('Error generating calendar link:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate calendar link' },
      { status: 500 }
    )
  }
}

