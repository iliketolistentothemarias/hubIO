/**
 * API Usage Statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAPIMonetizationService } from '@/lib/services/api-monetization'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const apiService = getAPIMonetizationService()

/**
 * GET /api/api-keys/[id]/usage
 * 
 * Get usage statistics for API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')

    const keys = apiService.getUserAPIKeys(user.id)
    const key = keys.find(k => k.id === params.id)

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      )
    }

    const stats = apiService.getUsageStats(key.id, period || undefined)

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching usage stats:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}

