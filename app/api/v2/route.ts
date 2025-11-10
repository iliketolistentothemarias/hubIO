/**
 * Public API v2
 * 
 * Public API endpoint with rate limiting and API key authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAPIMonetizationService } from '@/lib/services/api-monetization'
import { rateLimit, createRateLimitHeaders } from '@/lib/middleware/rate-limit'
import { getDatabase } from '@/lib/db/schema'

const apiService = getAPIMonetizationService()
const db = getDatabase()

/**
 * GET /api/v2/resources
 * 
 * Public API endpoint for resources
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

    // Check rate limit
    const rateLimitResult = await rateLimit(request, apiKey || undefined)
    if (rateLimitResult && !rateLimitResult.allowed) {
      const headers = createRateLimitHeaders(rateLimitResult)
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers }
      )
    }

    // Get resources
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')

    let resources = db.getAllResources().filter(r => r.verified)

    if (category) {
      resources = resources.filter(r => r.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      resources = resources.filter(
        r =>
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower)
      )
    }

    resources = resources.slice(0, limit)

    // Record usage if API key provided
    if (apiKey && rateLimitResult) {
      const key = apiService.getAPIKey(apiKey)
      if (key) {
        const startTime = Date.now()
        apiService.recordUsage(key.id, '/api/v2/resources', 'GET', 200, Date.now() - startTime)
      }
    }

    const response = {
      success: true,
      data: resources,
      meta: {
        count: resources.length,
        ...(rateLimitResult && {
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt,
          },
        }),
      },
    }

    const headers = rateLimitResult ? createRateLimitHeaders(rateLimitResult) : new Headers()
    return NextResponse.json(response, { headers })
  } catch (error: any) {
    console.error('Error in API v2:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

