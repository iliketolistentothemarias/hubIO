/**
 * API Monetization Types
 */

export interface APIKey {
  id: string
  userId: string
  name: string
  key: string
  secret: string
  tier: 'free' | 'basic' | 'pro' | 'enterprise'
  rateLimit: number // requests per minute
  usage: {
    requests: number
    period: string // YYYY-MM
    lastReset: Date
  }
  active: boolean
  createdAt: Date
  lastUsedAt?: Date
}

export interface APIUsage {
  id: string
  apiKeyId: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: Date
}

export interface APIPricing {
  tier: 'free' | 'basic' | 'pro' | 'enterprise'
  monthlyPrice: number
  requestsPerMonth: number
  rateLimit: number
  features: string[]
}

