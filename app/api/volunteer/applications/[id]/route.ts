/**
 * Volunteer Application Management API
 * 
 * Handles updating application status (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * PATCH /api/volunteer/applications/[id]
 * 
 * Update application status (approve/reject)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { status, hoursCompleted } = body

    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get application
    const application = db.getVolunteerApplication(params.id)
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get opportunity
    const opportunity = db.getVolunteerOpportunity(application.opportunityId)
    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    // Check authorization (organizer, admin, or own application for status updates)
    const isOrganizer = opportunity.organizationId === user.id
    const isAdmin = user.role === 'admin'
    const isOwner = application.userId === user.id

    if (!isOrganizer && !isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only organizer/admin can approve/reject, user can mark as completed
    if (status === 'approved' || status === 'rejected') {
      if (!isOrganizer && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Only organizers can approve/reject applications' },
          { status: 403 }
        )
      }
    }

    // Update application
    const updated = db.updateVolunteerApplication(params.id, {
      status: status as 'pending' | 'approved' | 'rejected' | 'completed',
      hoursCompleted: hoursCompleted || application.hoursCompleted,
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // If rejected, decrease signup count
    if (status === 'rejected' && application.status === 'pending') {
      const updatedOpp = {
        ...opportunity,
        volunteersSignedUp: Math.max(0, opportunity.volunteersSignedUp - 1),
        updatedAt: new Date(),
      }
      db.createVolunteerOpportunity(updatedOpp)
    }

    // If approved and was pending, update opportunity (already counted)
    // If completed, update user karma
    if (status === 'completed' && hoursCompleted) {
      const appUser = db.getUser(application.userId)
      if (appUser) {
        // Award karma based on hours (1 karma per hour)
        db.updateUser(application.userId, {
          karma: appUser.karma + hoursCompleted,
        })
      }
    }

    // TODO: Send notification to applicant

    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      message: `Application ${status} successfully`,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating application:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

