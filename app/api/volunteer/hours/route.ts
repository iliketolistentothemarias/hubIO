/**
 * Volunteer Hours API
 * 
 * Handles volunteer hour tracking and reporting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/volunteer/hours
 * 
 * Get volunteer hours for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const applications = db.getApplicationsByUser(user.id)

    // Calculate total hours from completed applications
    const totalHours = applications
      .filter(app => app.status === 'completed' && app.hoursCompleted)
      .reduce((sum, app) => sum + (app.hoursCompleted || 0), 0)

    // Get completed opportunities count
    const completedCount = applications.filter(app => app.status === 'completed').length

    // Get active applications count
    const activeCount = applications.filter(
      app => app.status === 'pending' || app.status === 'approved'
    ).length

    // Get applications by status
    const byStatus = {
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      completed: completedCount,
      rejected: applications.filter(app => app.status === 'rejected').length,
    }

    const response: ApiResponse<{
      totalHours: number
      completedOpportunities: number
      activeApplications: number
      byStatus: typeof byStatus
      applications: typeof applications
    }> = {
      success: true,
      data: {
        totalHours,
        completedOpportunities: completedCount,
        activeApplications: activeCount,
        byStatus,
        applications: applications.map((app) => {
          const opportunity = db.getVolunteerOpportunity(app.opportunityId)
          return {
            ...app,
            opportunity: opportunity
              ? {
                  id: opportunity.id,
                  title: opportunity.title,
                  organization: opportunity.organization,
                }
              : null,
          }
        }),
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching volunteer hours:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch volunteer hours' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/volunteer/hours
 * 
 * Log volunteer hours for a completed application
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { applicationId, hours } = body

    if (!applicationId || !hours || hours <= 0) {
      return NextResponse.json(
        { success: false, error: 'Application ID and valid hours are required' },
        { status: 400 }
      )
    }

    const application = db.getVolunteerApplication(applicationId)
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check authorization
    if (application.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update application with hours
    const updated = db.updateVolunteerApplication(applicationId, {
      hoursCompleted: hours,
      status: 'completed',
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update hours' },
        { status: 500 }
      )
    }

    // Update user karma
    const appUser = db.getUser(application.userId)
    if (appUser) {
      db.updateUser(application.userId, {
        karma: appUser.karma + hours, // 1 karma per hour
      })
    }

    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      message: 'Hours logged successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error logging hours:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to log hours' },
      { status: 500 }
    )
  }
}

