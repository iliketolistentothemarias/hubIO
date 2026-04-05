/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAPIMonetizationService } from '@/lib/services/api-monetization'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

/**
 * Rate Limit Middleware
 */
export async function rateLimit(
  request: NextRequest,
  apiKey?: string
): Promise<RateLimitResult | null> {
  if (!apiKey) {
    // Check IP-based rate limiting for non-API key requests
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    // In production, would use Redis for distributed rate limiting
    // For now, return null (no rate limit)
    return null
  }

  const apiService = getAPIMonetizationService()
  const key = apiService.getAPIKey(apiKey)

  if (!key) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(),
      limit: 0,
    }
  }

  const result = apiService.checkRateLimit(key)

  return {
    ...result,
    limit: key.usage.requests,
  }
}

/**
 * Create Rate Limit Headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.resetAt.getTime().toString())
  return headers
}

