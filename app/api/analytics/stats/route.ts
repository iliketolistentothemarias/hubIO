/**
 * Analytics Stats API Route
 * 
 * Provides community statistics and metrics.
 * 
 * Endpoints:
 * - GET /api/analytics/stats - Get community statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalytics } from '@/lib/utils/analytics'
import { ApiResponse, CommunityStats } from '@/lib/types'

/**
 * GET /api/analytics/stats
 * 
 * Get community statistics (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const analytics = getAnalytics()
    const stats = analytics.getCommunityStats()

    const response: ApiResponse<CommunityStats> = {
      success: true,
      data: stats,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

