/**
 * Subscriptions API
 * 
 * Handle subscription management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionService } from '@/lib/services/subscriptions'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const subscriptionService = getSubscriptionService()

/**
 * GET /api/subscriptions
 * 
 * Get user's current subscription
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const subscription = subscriptionService.getUserSubscription(user.id)

    const response: ApiResponse<typeof subscription> = {
      success: true,
      data: subscription,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching subscription:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions
 * 
 * Create or update subscription
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { planId, paymentMethodId } = body

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const subscription = await subscriptionService.createSubscription(
      user.id,
      planId,
      paymentMethodId
    )

    const response: ApiResponse<typeof subscription> = {
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating subscription:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subscriptions
 * 
 * Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const immediately = searchParams.get('immediately') === 'true'

    const cancelled = await subscriptionService.cancelSubscription(user.id, immediately)

    const response: ApiResponse<{ cancelled: boolean }> = {
      success: true,
      data: { cancelled },
      message: immediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at end of billing period',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

