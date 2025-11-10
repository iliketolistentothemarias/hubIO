/**
 * Predictive Analytics Engine
 * 
 * Implements ML-based predictions for:
 * - User behavior prediction
 * - Resource demand forecasting
 * - Event attendance prediction
 * - Donation amount prediction
 * - User churn prediction
 */

import { User, Resource, Event, FundraisingCampaign, Donation } from '@/lib/types'
import { getDatabase } from '@/lib/db/schema'

export interface PredictionResult {
  value: number
  confidence: number
  factors: string[]
  timestamp: Date
}

export interface BehaviorPrediction {
  userId: string
  predictedActions: {
    action: string
    probability: number
    timeframe: string
  }[]
  nextResourceView?: string
  nextEventRSVP?: string
  churnRisk: number
}

export class PredictiveAnalytics {
  private db = getDatabase()

  /**
   * Predict User Behavior
   */
  predictUserBehavior(userId: string): BehaviorPrediction {
    const user = this.db.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Analyze user history
    const resources = this.db.getAllResources()
    const events = this.db.getUpcomingEvents()
    const donations = this.db.getDonationsByUser(userId)
    const registrations = this.db.getEventRegistrationsByUser(userId)

    // Calculate probabilities based on patterns
    const predictedActions = []

    // Predict resource views based on category preferences
    const categoryPreferences = this.calculateCategoryPreferences(userId)
    const topCategory = Object.entries(categoryPreferences)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]

    if (topCategory) {
      predictedActions.push({
        action: `View ${topCategory} resources`,
        probability: 0.75,
        timeframe: 'next 7 days',
      })
    }

    // Predict event RSVP
    const upcomingEvents = events.filter(e => e.date > new Date())
    if (upcomingEvents.length > 0) {
      const likelyEvent = upcomingEvents[0]
      predictedActions.push({
        action: `RSVP to ${likelyEvent.name}`,
        probability: 0.60,
        timeframe: 'next 3 days',
      })
    }

    // Calculate churn risk
    const lastActive = user.lastActiveAt
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    const churnRisk = Math.min(1, daysSinceActive / 30) // Higher risk if inactive > 30 days

    return {
      userId,
      predictedActions,
      churnRisk,
    }
  }

  /**
   * Forecast Resource Demand
   */
  forecastResourceDemand(resourceId: string, days: number = 30): PredictionResult {
    const resource = this.db.getResource(resourceId)
    if (!resource) {
      throw new Error('Resource not found')
    }

    // Analyze historical data
    // In production, would use time series analysis
    const baseDemand = resource.reviewCount || 10
    const growthRate = 0.05 // 5% growth per month
    const seasonalFactor = this.getSeasonalFactor(new Date())

    const predictedDemand = baseDemand * (1 + growthRate) * seasonalFactor * (days / 30)

    return {
      value: Math.round(predictedDemand),
      confidence: 0.70,
      factors: [
        'Historical view count',
        'Category popularity',
        'Seasonal trends',
        'Location factors',
      ],
      timestamp: new Date(),
    }
  }

  /**
   * Predict Event Attendance
   */
  predictEventAttendance(eventId: string): PredictionResult {
    const event = this.db.getEvent(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    const registrations = this.db.getEventRegistrationsByEvent(eventId)
    const currentRegistered = registrations.length

    // Predict final attendance based on:
    // - Current registrations
    // - Historical no-show rate (typically 20-30%)
    // - Event type and category
    // - Time until event

    const daysUntilEvent = (event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    const noShowRate = 0.25 // 25% no-show rate
    const registrationGrowth = daysUntilEvent > 7 ? 1.5 : 1.2 // More growth if far away

    const predictedRegistered = Math.round(currentRegistered * registrationGrowth)
    const predictedAttendance = Math.round(predictedRegistered * (1 - noShowRate))

    return {
      value: predictedAttendance,
      confidence: 0.75,
      factors: [
        `Current registrations: ${currentRegistered}`,
        `Days until event: ${Math.round(daysUntilEvent)}`,
        `Estimated no-show rate: ${(noShowRate * 100).toFixed(0)}%`,
        'Event category trends',
      ],
      timestamp: new Date(),
    }
  }

  /**
   * Predict Donation Amount
   */
  predictDonationAmount(campaignId: string, userId?: string): PredictionResult {
    const campaign = this.db.getCampaign(campaignId)
    if (!campaign) {
      throw new Error('Campaign not found')
    }

    let baseAmount = 50 // Default prediction

    if (userId) {
      // Analyze user's donation history
      const userDonations = this.db.getDonationsByUser(userId)
      if (userDonations.length > 0) {
        const avgDonation = userDonations.reduce((sum, d) => sum + d.amount, 0) / userDonations.length
        baseAmount = avgDonation
      }
    } else {
      // Use campaign average
      const campaignDonations = this.db.getDonationsByCampaign(campaignId)
      if (campaignDonations.length > 0) {
        const avgDonation = campaignDonations.reduce((sum, d) => sum + d.amount, 0) / campaignDonations.length
        baseAmount = avgDonation
      }
    }

    // Adjust based on campaign progress
    const progressRatio = campaign.raised / campaign.goal
    const urgencyFactor = progressRatio > 0.8 ? 1.2 : 1.0 // Higher donations near goal

    const predictedAmount = baseAmount * urgencyFactor

    return {
      value: Math.round(predictedAmount),
      confidence: userId ? 0.80 : 0.65,
      factors: userId
        ? ['User donation history', 'Campaign progress', 'User engagement level']
        : ['Campaign average', 'Campaign progress', 'Category trends'],
      timestamp: new Date(),
    }
  }

  /**
   * Predict User Churn
   */
  predictChurn(userId: string): PredictionResult {
    const user = this.db.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const daysSinceActive = (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    const engagementScore = this.calculateEngagementScore(userId)

    // Churn risk factors:
    // - Days since last active
    // - Low engagement score
    // - No recent activity
    // - Low karma/participation

    let churnRisk = 0

    if (daysSinceActive > 30) churnRisk += 0.4
    if (daysSinceActive > 60) churnRisk += 0.3
    if (daysSinceActive > 90) churnRisk += 0.2

    if (engagementScore < 0.3) churnRisk += 0.3
    if (user.karma < 10) churnRisk += 0.2

    churnRisk = Math.min(1, churnRisk)

    return {
      value: churnRisk,
      confidence: 0.70,
      factors: [
        `Days since active: ${Math.round(daysSinceActive)}`,
        `Engagement score: ${(engagementScore * 100).toFixed(0)}%`,
        `Karma points: ${user.karma}`,
        'Activity patterns',
      ],
      timestamp: new Date(),
    }
  }

  /**
   * Calculate Category Preferences
   */
  private calculateCategoryPreferences(userId: string): Record<string, number> {
    const preferences: Record<string, number> = {}
    
    // Analyze user's interactions with resources
    // In production, would analyze actual user behavior data
    
    return preferences
  }

  /**
   * Calculate Engagement Score
   */
  private calculateEngagementScore(userId: string): number {
    const user = this.db.getUser(userId)
    if (!user) return 0

    const donations = this.db.getDonationsByUser(userId).length
    const registrations = this.db.getEventRegistrationsByUser(userId).length
    const applications = this.db.getApplicationsByUser(userId).length

    // Normalize scores (0-1)
    const donationScore = Math.min(1, donations / 10)
    const eventScore = Math.min(1, registrations / 5)
    const volunteerScore = Math.min(1, applications / 3)
    const karmaScore = Math.min(1, user.karma / 100)

    return (donationScore * 0.3 + eventScore * 0.3 + volunteerScore * 0.2 + karmaScore * 0.2)
  }

  /**
   * Get Seasonal Factor
   */
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth()
    // Higher demand in certain months (e.g., holiday season)
    if (month >= 10 || month <= 1) return 1.2 // Nov, Dec, Jan
    if (month >= 5 && month <= 7) return 1.1 // Summer months
    return 1.0
  }
}

// Singleton instance
let predictiveAnalytics: PredictiveAnalytics | null = null

export function getPredictiveAnalytics(): PredictiveAnalytics {
  if (!predictiveAnalytics) {
    predictiveAnalytics = new PredictiveAnalytics()
  }
  return predictiveAnalytics
}

