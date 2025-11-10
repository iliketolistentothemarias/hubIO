/**
 * Event Reminders API Route
 * 
 * Handles event reminder scheduling and sending.
 * 
 * Endpoints:
 * - POST /api/events/reminders - Schedule reminder
 * - GET /api/events/reminders - Get scheduled reminders
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { getEmailService } from '@/lib/services/email'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()
const emailService = getEmailService()

/**
 * POST /api/events/reminders
 * 
 * Schedule or send event reminder
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { eventId, reminderType } = body // '24h', '1h', '15m'

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

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

    // Calculate reminder time
    const eventDate = new Date(event.date)
    let reminderTime: Date

    switch (reminderType) {
      case '24h':
        reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)
        break
      case '1h':
        reminderTime = new Date(eventDate.getTime() - 60 * 60 * 1000)
        break
      case '15m':
        reminderTime = new Date(eventDate.getTime() - 15 * 60 * 1000)
        break
      default:
        reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)
    }

    // Check if reminder should be sent now
    const now = new Date()
    if (reminderTime <= now && !registration.reminderSent) {
      // Send reminder email
      const reminderHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Event Reminder</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #8B6F47;">Event Reminder: ${event.name}</h2>
              <p>Hi ${user.name},</p>
              <p>This is a reminder that you have an upcoming event:</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${event.name}</h3>
                <p><strong>Date:</strong> ${event.date.toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Location:</strong> ${event.location.address}</p>
              </div>
              <p>We look forward to seeing you there!</p>
              <p>Best regards,<br>The HubIO Team</p>
            </div>
          </body>
        </html>
      `

      await emailService.sendEmail({
        to: user.email,
        subject: `Reminder: ${event.name}`,
        html: reminderHtml,
      })

      // Mark reminder as sent
      db.updateEventRegistration(registration.id, {
        reminderSent: true,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        reminderTime,
        reminderType,
        sent: reminderTime <= now,
      },
      message: 'Reminder scheduled',
    })
  } catch (error: any) {
    console.error('Error scheduling reminder:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to schedule reminder' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events/reminders
 * 
 * Get scheduled reminders for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const registrations = db.getEventRegistrationsByUser(user.id)

    const reminders = registrations
      .filter(reg => reg.status === 'registered')
      .map(reg => {
        const event = db.getEvent(reg.eventId)
        if (!event) return null

        const eventDate = new Date(event.date)
        const now = new Date()
        const timeUntil = eventDate.getTime() - now.getTime()

        return {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          eventTime: event.time,
          reminderSent: reg.reminderSent || false,
          timeUntil: timeUntil > 0 ? timeUntil : 0,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      data: reminders,
    })
  } catch (error: any) {
    console.error('Error fetching reminders:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

