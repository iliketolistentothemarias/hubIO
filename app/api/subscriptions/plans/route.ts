/**
 * Subscription Plans API
 * 
 * Get available subscription plans
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionService } from '@/lib/services/subscriptions'
import { ApiResponse } from '@/lib/types'

const subscriptionService = getSubscriptionService()

/**
 * GET /api/subscriptions/plans
 * 
 * Get all available subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    const plans = subscriptionService.getDefaultPlans()

    const response: ApiResponse<typeof plans> = {
      success: true,
      data: plans,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

