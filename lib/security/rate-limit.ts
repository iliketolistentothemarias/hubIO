/**
 * Rate Limiting Service
 * 
 * Implements rate limiting to prevent abuse
 */

export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []

    // Remove old requests outside window
    const recentRequests = requests.filter(time => now - time < windowMs)

    if (recentRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return true
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string, maxRequests: number, windowMs: number): number {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    const recentRequests = requests.filter(time => now - time < windowMs)
    return Math.max(0, maxRequests - recentRequests.length)
  }
}

// Singleton instance
let rateLimiter: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter()
  }
  return rateLimiter
}

