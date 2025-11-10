/**
 * Predictive Analytics API
 * 
 * Endpoints for ML predictions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPredictiveAnalytics } from '@/lib/ai/predictive'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const analytics = getPredictiveAnalytics()

/**
 * POST /api/ai/predict
 * 
 * Get predictions
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { type, targetId, options } = body

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Prediction type is required' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'user-behavior':
        result = analytics.predictUserBehavior(user.id)
        break

      case 'resource-demand':
        if (!targetId) {
          return NextResponse.json(
            { success: false, error: 'Resource ID is required' },
            { status: 400 }
          )
        }
        result = analytics.forecastResourceDemand(targetId, options?.days || 30)
        break

      case 'event-attendance':
        if (!targetId) {
          return NextResponse.json(
            { success: false, error: 'Event ID is required' },
            { status: 400 }
          )
        }
        result = analytics.predictEventAttendance(targetId)
        break

      case 'donation-amount':
        if (!targetId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 }
          )
        }
        result = analytics.predictDonationAmount(targetId, options?.userId || user.id)
        break

      case 'churn':
        result = analytics.predictChurn(user.id)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid prediction type' },
          { status: 400 }
        )
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error generating prediction:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}

