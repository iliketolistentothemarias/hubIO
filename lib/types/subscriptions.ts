/**
 * Subscription Types
 */

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  limits: {
    resources?: number
    events?: number
    campaigns?: number
    storage?: number // in MB
    apiCalls?: number
  }
  popular?: boolean
  active: boolean
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  stripeSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Usage {
  id: string
  userId: string
  subscriptionId: string
  period: string // YYYY-MM
  resources: number
  events: number
  campaigns: number
  storage: number
  apiCalls: number
  createdAt: Date
}

