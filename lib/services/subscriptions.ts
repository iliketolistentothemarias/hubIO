/**
 * Subscription Service
 * 
 * Handles subscription management, billing, and feature gating
 */

import { SubscriptionPlan, Subscription, Usage } from '@/lib/types/subscriptions'
import { getDatabase } from '@/lib/db/schema'
import { getPaymentService } from './payments'

export class SubscriptionService {
  private db = getDatabase()
  private paymentService = getPaymentService()

  /**
   * Default Subscription Plans
   */
  getDefaultPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for individuals',
        price: 0,
        interval: 'monthly',
        features: [
          '5 resource submissions per month',
          '2 event listings per month',
          'Basic analytics',
          'Community access',
        ],
        limits: {
          resources: 5,
          events: 2,
          campaigns: 0,
          storage: 100,
          apiCalls: 100,
        },
        active: true,
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For active community members',
        price: 9.99,
        interval: 'monthly',
        features: [
          'Unlimited resource submissions',
          'Unlimited event listings',
          'Advanced analytics',
          'Priority support',
          'API access',
          'Custom branding',
        ],
        limits: {
          resources: -1, // Unlimited
          events: -1,
          campaigns: 5,
          storage: 1000,
          apiCalls: 10000,
        },
        popular: true,
        active: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For organizations and businesses',
        price: 49.99,
        interval: 'monthly',
        features: [
          'Everything in Pro',
          'Unlimited campaigns',
          'White-label customization',
          'Dedicated support',
          'Custom integrations',
          'Advanced API access',
          'Multi-user management',
        ],
        limits: {
          resources: -1,
          events: -1,
          campaigns: -1,
          storage: 10000,
          apiCalls: 100000,
        },
        active: true,
      },
    ]
  }

  /**
   * Create Subscription
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<Subscription> {
    const plan = this.getDefaultPlans().find(p => p.id === planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    if (plan.price > 0) {
      // Create Stripe subscription
      // In production, would use Stripe subscriptions API
      // For now, simulate
    }

    const now = new Date()
    const subscription: Subscription = {
      id: `sub_${Date.now()}_${userId}`,
      userId,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      trialEnd: plan.price > 0 ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : undefined, // 14-day trial
      createdAt: now,
      updatedAt: now,
    }

    // Store subscription (would be in database)
    const subscriptions = this.db.getCollection('subscriptions')
    subscriptions.set(subscription.id, subscription)
    this.db.save()

    return subscription
  }

  /**
   * Get User Subscription
   */
  getUserSubscription(userId: string): Subscription | null {
    const subscriptions = this.db.getCollection('subscriptions')

    for (const sub of subscriptions.values()) {
      const subscription = sub as any
      if (subscription.userId === userId && subscription.status === 'active') {
        return subscription
      }
    }
    return null
  }

  /**
   * Check Feature Access
   */
  hasFeatureAccess(userId: string, feature: string): boolean {
    const subscription = this.getUserSubscription(userId)
    if (!subscription) {
      // Free tier
      const freePlan = this.getDefaultPlans().find(p => p.id === 'free')
      return freePlan?.features.includes(feature) || false
    }

    const plan = this.getDefaultPlans().find(p => p.id === subscription.planId)
    return plan?.features.includes(feature) || false
  }

  /**
   * Check Usage Limits
   */
  checkUsageLimit(userId: string, resourceType: 'resources' | 'events' | 'campaigns'): boolean {
    const subscription = this.getUserSubscription(userId)
    const plan = subscription
      ? this.getDefaultPlans().find(p => p.id === subscription.planId)
      : this.getDefaultPlans().find(p => p.id === 'free')

    if (!plan) return false

    const limit = plan.limits[resourceType]
    if (limit === undefined) return false
    if (limit === -1) return true // Unlimited

    // Check current usage
    const usage = this.getCurrentUsage(userId)
    const currentUsage = usage[resourceType] || 0

    return currentUsage < limit
  }

  /**
   * Get Current Usage
   */
  getCurrentUsage(userId: string): { resources: number; events: number; campaigns: number } {
    // In production, would query actual usage
    return {
      resources: 0,
      events: 0,
      campaigns: 0,
    }
  }

  /**
   * Cancel Subscription
   */
  async cancelSubscription(userId: string, cancelImmediately: boolean = false): Promise<boolean> {
    const subscription = this.getUserSubscription(userId)
    if (!subscription) {
      throw new Error('No active subscription found')
    }

    if (cancelImmediately) {
      subscription.status = 'cancelled'
    } else {
      subscription.cancelAtPeriodEnd = true
    }

    subscription.updatedAt = new Date()
    const subscriptions = this.db.getCollection('subscriptions')
    subscriptions.set(subscription.id, subscription)
    this.db.save()

    return true
  }
}

// Singleton instance
let subscriptionService: SubscriptionService | null = null

export function getSubscriptionService(): SubscriptionService {
  if (!subscriptionService) {
    subscriptionService = new SubscriptionService()
  }
  return subscriptionService
}

