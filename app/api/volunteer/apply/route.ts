/**
 * Volunteer Application API
 * 
 * Handles volunteer applications for opportunities.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, VolunteerApplication } from '@/lib/types'

const db = getDatabase()

/**
 * POST /api/volunteer/apply
 * 
 * Apply to a volunteer opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth()
    const body = await request.json()

    const { opportunityId } = body

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      )
    }

    const opportunity = db.getVolunteerOpportunity(opportunityId)
    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    if (opportunity.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Opportunity is not active' },
        { status: 400 }
      )
    }

    if (opportunity.volunteersSignedUp >= opportunity.volunteersNeeded) {
      return NextResponse.json(
        { success: false, error: 'Opportunity is full' },
        { status: 400 }
      )
    }

    // Create application
    const application: VolunteerApplication = {
      id: `app_${Date.now()}`,
      opportunityId,
      userId: user.id,
      status: 'pending',
      appliedAt: new Date(),
    }

    // Update opportunity signup count
    const updated = {
      ...opportunity,
      volunteersSignedUp: opportunity.volunteersSignedUp + 1,
      updatedAt: new Date(),
    }
    db.createVolunteerOpportunity(updated)

    // In production, would save application to database
    // For demo, we'll just return success

    const response: ApiResponse<VolunteerApplication> = {
      success: true,
      data: application,
      message: 'Application submitted successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error submitting application:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}

