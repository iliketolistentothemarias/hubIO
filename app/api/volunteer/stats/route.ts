/**
 * Volunteer Statistics API
 * 
 * Provides volunteer-specific statistics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getVolunteerService } from '@/lib/services/volunteer'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/volunteer/stats
 * 
 * Get volunteer statistics for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth()
    const volunteerService = getVolunteerService()

    const stats = {
      totalHours: volunteerService.getVolunteerHours(user.id),
      opportunitiesCompleted: volunteerService.getCompletedOpportunities(user.id),
      activeApplications: volunteerService.getActiveApplications(user.id).length,
      impactScore: volunteerService.calculateImpactScore(user.id),
    }

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching volunteer stats:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

