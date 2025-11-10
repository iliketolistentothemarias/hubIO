/**
 * Volunteer Applications API
 * 
 * Handles fetching and managing volunteer applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/volunteer/applications
 * 
 * Get applications for the authenticated user or all applications (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get('opportunityId')

    let applications

    if (opportunityId) {
      // Get applications for specific opportunity (organizer/admin only)
      const opportunity = db.getVolunteerOpportunity(opportunityId)
      if (!opportunity) {
        return NextResponse.json(
          { success: false, error: 'Opportunity not found' },
          { status: 404 }
        )
      }

      // Check if user is organizer or admin
      if (user.role !== 'admin' && opportunity.organizationId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        )
      }

      applications = db.getApplicationsByOpportunity(opportunityId)
    } else {
      // Get user's own applications
      applications = db.getApplicationsByUser(user.id)
    }

    // Enrich with opportunity details
    const enrichedApplications = applications.map((app) => {
      const opportunity = db.getVolunteerOpportunity(app.opportunityId)
      return {
        ...app,
        opportunity: opportunity
          ? {
              id: opportunity.id,
              title: opportunity.title,
              organization: opportunity.organization,
              date: opportunity.date,
              location: opportunity.location,
            }
          : null,
      }
    })

    const response: ApiResponse<typeof enrichedApplications> = {
      success: true,
      data: enrichedApplications,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching applications:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

