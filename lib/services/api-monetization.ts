/**
 * API Monetization Service
 * 
 * Handles API key management, rate limiting, and usage tracking
 */

import { APIKey, APIUsage, APIPricing } from '@/lib/types/api'
import { getDatabase } from '@/lib/db/schema'
import crypto from 'crypto'

export class APIMonetizationService {
  private db = getDatabase()

  /**
   * Pricing Tiers
   */
  getPricingTiers(): APIPricing[] {
    return [
      {
        tier: 'free',
        monthlyPrice: 0,
        requestsPerMonth: 1000,
        rateLimit: 10, // per minute
        features: ['Basic API access', 'Community data'],
      },
      {
        tier: 'basic',
        monthlyPrice: 29.99,
        requestsPerMonth: 10000,
        rateLimit: 60,
        features: ['Basic API access', 'Community data', 'Priority support'],
      },
      {
        tier: 'pro',
        monthlyPrice: 99.99,
        requestsPerMonth: 100000,
        rateLimit: 300,
        features: [
          'Full API access',
          'All data endpoints',
          'Webhook support',
          'Priority support',
          'Custom rate limits',
        ],
      },
      {
        tier: 'enterprise',
        monthlyPrice: 499.99,
        requestsPerMonth: -1, // Unlimited
        rateLimit: 1000,
        features: [
          'Everything in Pro',
          'Unlimited requests',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
        ],
      },
    ]
  }

  /**
   * Generate API Key
   */
  generateAPIKey(): { key: string; secret: string } {
    const key = `hubio_${crypto.randomBytes(16).toString('hex')}`
    const secret = crypto.randomBytes(32).toString('hex')
    return { key, secret }
  }

  /**
   * Create API Key
   */
  createAPIKey(userId: string, name: string, tier: string = 'free'): APIKey {
    const { key, secret } = this.generateAPIKey()
    const pricing = this.getPricingTiers().find(p => p.tier === tier) || this.getPricingTiers()[0]

    const apiKey: APIKey = {
      id: `apikey_${Date.now()}_${userId}`,
      userId,
      name,
      key,
      secret,
      tier: tier as any,
      rateLimit: pricing.rateLimit,
      usage: {
        requests: 0,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        lastReset: new Date(),
      },
      active: true,
      createdAt: new Date(),
    }

    const apiKeys = this.db.getCollection('apiKeys')
    apiKeys.set(apiKey.id, apiKey)
    this.db.save()

    return apiKey
  }

  /**
   * Get API Key
   */
  getAPIKey(key: string): APIKey | undefined {
    const apiKeys = this.db.getCollection('apiKeys')
    for (const apiKey of apiKeys.values()) {
      if ((apiKey as any).key === key && (apiKey as any).active) {
        return apiKey as any
      }
    }
    return undefined
  }

  /**
   * Get User API Keys
   */
  getUserAPIKeys(userId: string): APIKey[] {
    const apiKeys = this.db.getCollection('apiKeys')
    const keys: APIKey[] = []
    for (const key of apiKeys.values()) {
      if (key.userId === userId) {
        keys.push(key)
      }
    }
    return keys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Check Rate Limit
   */
  checkRateLimit(apiKey: APIKey): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = new Date()
    const currentPeriod = now.toISOString().slice(0, 7)

    // Reset if new period
    if (apiKey.usage.period !== currentPeriod) {
      apiKey.usage.requests = 0
      apiKey.usage.period = currentPeriod
      apiKey.usage.lastReset = now
    }

    const pricing = this.getPricingTiers().find(p => p.tier === apiKey.tier)!
    const limit = pricing.requestsPerMonth === -1 ? Infinity : pricing.requestsPerMonth

    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - apiKey.usage.requests)
    const allowed = remaining > 0

    // Calculate reset time (end of month)
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return { allowed, remaining, resetAt }
  }

  /**
   * Record API Usage
   */
  recordUsage(apiKeyId: string, endpoint: string, method: string, statusCode: number, responseTime: number): void {
    const usage: APIUsage = {
      id: `usage_${Date.now()}_${apiKeyId}`,
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: new Date(),
    }

    const apiUsage = this.db.getCollection('apiUsage')
    apiUsage.set(usage.id, usage)

    // Update API key usage
    const apiKeys = this.db.getCollection('apiKeys')
    const apiKey = apiKeys.get(apiKeyId) as any
    if (apiKey) {
      apiKey.usage.requests++
      apiKey.lastUsedAt = new Date()
      apiKeys.set(apiKeyId, apiKey)
    }
    this.db.save()
  }

  /**
   * Get Usage Statistics
   */
  getUsageStats(apiKeyId: string, period?: string): {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    endpoints: Record<string, number>
  } {
    const apiUsageCollection = this.db.getCollection('apiUsage')
    
    const currentPeriod = period || new Date().toISOString().slice(0, 7)
    const usages: APIUsage[] = []

    for (const usage of apiUsageCollection.values()) {
      const apiUsage = usage as any
      if (apiUsage.apiKeyId === apiKeyId && apiUsage.timestamp.toISOString().slice(0, 7) === currentPeriod) {
        usages.push(apiUsage)
      }
    }
    
    if (usages.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        endpoints: {},
      }
    }

    const totalRequests = usages.length
    const successfulRequests = usages.filter(u => u.statusCode < 400).length
    const failedRequests = totalRequests - successfulRequests
    const averageResponseTime =
      usages.length > 0
        ? usages.reduce((sum, u) => sum + u.responseTime, 0) / usages.length
        : 0

    const endpoints: Record<string, number> = {}
    for (const usage of usages) {
      endpoints[usage.endpoint] = (endpoints[usage.endpoint] || 0) + 1
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      endpoints,
    }
  }
}

// Singleton instance
let apiMonetizationService: APIMonetizationService | null = null

export function getAPIMonetizationService(): APIMonetizationService {
  if (!apiMonetizationService) {
    apiMonetizationService = new APIMonetizationService()
  }
  return apiMonetizationService
}

