/**
 * API Keys Management API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAPIMonetizationService } from '@/lib/services/api-monetization'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const apiService = getAPIMonetizationService()

/**
 * POST /api/api-keys
 * 
 * Create API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { name, tier } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const apiKey = apiService.createAPIKey(user.id, name, tier || 'free')

    const response: ApiResponse<typeof apiKey> = {
      success: true,
      data: apiKey,
      message: 'API key created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating API key:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/api-keys
 * 
 * Get user's API keys
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const keys = apiService.getUserAPIKeys(user.id)

    // Don't return secrets
    const safeKeys = keys.map(k => ({
      ...k,
      secret: '***hidden***',
    }))

    const response: ApiResponse<typeof safeKeys> = {
      success: true,
      data: safeKeys,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching API keys:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

