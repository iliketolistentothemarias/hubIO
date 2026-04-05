/**
 * AI Recommendations API Route
 * 
 * Provides personalized recommendations for users.
 * 
 * Endpoints:
 * - GET /api/ai/recommendations - Get personalized recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRecommendationEngine } from '@/lib/ai/recommendations'
import { getUserFromRequest } from '@/lib/auth/server-request'
import { ApiResponse, Recommendation } from '@/lib/types'

/**
 * GET /api/ai/recommendations
 * 
 * Get personalized recommendations for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Make recommendations available without auth for demo
    // In production, you'd want to require auth for personalized recommendations
    const authed = await getUserFromRequest(request)
    const userId = authed?.id ?? null
    
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    const engine = getRecommendationEngine()
    // Use a default user ID if not authenticated
    const recommendations = await engine.getRecommendations(userId || 'anonymous', limit)

    const response: ApiResponse<Recommendation[]> = {
      success: true,
      data: recommendations,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

