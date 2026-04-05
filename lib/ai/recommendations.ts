/**
 * AI Recommendation Engine
 * 
 * This module provides intelligent recommendations for resources, events,
 * volunteer opportunities, and fundraising campaigns based on user behavior,
 * preferences, location, and community trends.
 * 
 * In production, this would integrate with:
 * - OpenAI API for advanced recommendations
 * - TensorFlow.js for on-device ML
 * - Custom ML models trained on community data
 */

import { User, Resource, Event, VolunteerOpportunity, FundraisingCampaign, Recommendation } from '@/lib/types'
import { getDatabase } from '@/lib/db/schema'

/**
 * Recommendation Engine Class
 * 
 * Analyzes user data and provides personalized recommendations
 */
export class RecommendationEngine {
  private db = getDatabase()

  /**
   * Get Personalized Recommendations for User
   * 
   * @param userId - User ID
   * @param limit - Maximum number of recommendations
   * @returns Promise<Recommendation[]>
   */
  async getRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    const user = this.db.getUser(userId)
    if (!user) return []

    const recommendations: Recommendation[] = []

    // Get resource recommendations
    const resourceRecs = await this.recommendResources(user, limit / 4)
    recommendations.push(...resourceRecs)

    // Get event recommendations
    const eventRecs = await this.recommendEvents(user, limit / 4)
    recommendations.push(...eventRecs)

    // Get volunteer opportunity recommendations
    const volunteerRecs = await this.recommendVolunteerOpportunities(user, limit / 4)
    recommendations.push(...volunteerRecs)

    // Get fundraising campaign recommendations
    const campaignRecs = await this.recommendCampaigns(user, limit / 4)
    recommendations.push(...campaignRecs)

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Recommend Resources Based on User Profile
   * 
   * @param user - User object
   * @param limit - Maximum recommendations
   * @returns Promise<Recommendation[]>
   */
  private async recommendResources(user: User, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    const allResources = this.db.getAllResources()

    for (const resource of allResources) {
      let score = 0
      const reasons: string[] = []

      // Location-based scoring (if user has location)
      if (user.location && resource.location) {
        const distance = this.calculateDistance(
          user.location.lat,
          user.location.lng,
          resource.location.lat,
          resource.location.lng
        )
        if (distance < 5) {
          score += 30
          reasons.push('Near your location')
        } else if (distance < 15) {
          score += 15
          reasons.push('Within 15 miles')
        }
      }

      // Category preference scoring
      // (In production, this would analyze user's past interactions)
      if (resource.featured) {
        score += 20
        reasons.push('Featured resource')
      }

      // Rating-based scoring
      if (resource.rating && resource.rating >= 4.5) {
        score += 15
        reasons.push('Highly rated')
      }

      // Popularity scoring
      if (resource.reviewCount && resource.reviewCount > 50) {
        score += 10
        reasons.push('Popular in community')
      }

      // Verified status
      if (resource.verified) {
        score += 10
        reasons.push('Verified organization')
      }

      if (score > 0) {
        recommendations.push({
          id: `rec_${resource.id}_${Date.now()}`,
          userId: user.id,
          type: 'resource',
          itemId: resource.id,
          score,
          reason: reasons.join(', '),
          createdAt: new Date(),
        })
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Recommend Events Based on User Profile
   * 
   * @param user - User object
   * @param limit - Maximum recommendations
   * @returns Promise<Recommendation[]>
   */
  private async recommendEvents(user: User, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    const upcomingEvents = this.db.getUpcomingEvents()

    for (const event of upcomingEvents) {
      let score = 0
      const reasons: string[] = []

      // Location-based scoring
      if (user.location && event.location) {
        const distance = this.calculateDistance(
          user.location.lat,
          user.location.lng,
          event.location.lat,
          event.location.lng
        )
        if (distance < 5) {
          score += 30
          reasons.push('Near your location')
        } else if (distance < 15) {
          score += 15
          reasons.push('Within 15 miles')
        }
      }

      // Time-based scoring (prefer events happening soon)
      const daysUntil = Math.floor(
        (event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntil <= 7) {
        score += 20
        reasons.push('Happening soon')
      } else if (daysUntil <= 30) {
        score += 10
        reasons.push('Upcoming this month')
      }

      // Popularity scoring
      if (event.registered > 10) {
        score += 15
        reasons.push('Popular event')
      }

      // Free events get bonus
      if (!event.ticketPrice || event.ticketPrice === 0) {
        score += 10
        reasons.push('Free event')
      }

      if (score > 0) {
        recommendations.push({
          id: `rec_${event.id}_${Date.now()}`,
          userId: user.id,
          type: 'event',
          itemId: event.id,
          score,
          reason: reasons.join(', '),
          createdAt: new Date(),
        })
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Recommend Volunteer Opportunities
   * 
   * @param user - User object
   * @param limit - Maximum recommendations
   * @returns Promise<Recommendation[]>
   */
  private async recommendVolunteerOpportunities(
    user: User,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    const opportunities = this.db.getAllVolunteerOpportunities()

    for (const opportunity of opportunities) {
      if (opportunity.status !== 'active') continue

      let score = 0
      const reasons: string[] = []

      // Location-based scoring
      if (user.location && opportunity.location) {
        const distance = this.calculateDistance(
          user.location.lat,
          user.location.lng,
          opportunity.location.lat,
          opportunity.location.lng
        )
        if (distance < 5) {
          score += 30
          reasons.push('Near your location')
        } else if (distance < 15) {
          score += 15
          reasons.push('Within 15 miles')
        }
      }

      // Remote opportunities get bonus
      if (opportunity.remote) {
        score += 25
        reasons.push('Remote opportunity')
      }

      // Urgency scoring (few spots left)
      const spotsLeft = opportunity.volunteersNeeded - opportunity.volunteersSignedUp
      if (spotsLeft <= 3) {
        score += 20
        reasons.push('Few spots remaining')
      } else if (spotsLeft <= 10) {
        score += 10
        reasons.push('Limited availability')
      }

      // Time-based scoring
      const daysUntil = Math.floor(
        (opportunity.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntil <= 7) {
        score += 15
        reasons.push('Happening soon')
      }

      if (score > 0) {
        recommendations.push({
          id: `rec_${opportunity.id}_${Date.now()}`,
          userId: user.id,
          type: 'volunteer',
          itemId: opportunity.id,
          score,
          reason: reasons.join(', '),
          createdAt: new Date(),
        })
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Recommend Fundraising Campaigns
   * 
   * @param user - User object
   * @param limit - Maximum recommendations
   * @returns Promise<Recommendation[]>
   */
  private async recommendCampaigns(user: User, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    const campaigns = this.db.getAllCampaigns().filter(c => c.status === 'active')

    for (const campaign of campaigns) {
      let score = 0
      const reasons: string[] = []

      // Progress-based scoring (campaigns close to goal)
      const progress = (campaign.raised / campaign.goal) * 100
      if (progress >= 80 && progress < 100) {
        score += 30
        reasons.push('Close to goal')
      } else if (progress >= 50) {
        score += 15
        reasons.push('Making good progress')
      }

      // Urgency scoring (ending soon)
      const daysLeft = campaign.endDate ? Math.floor(
        (campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ) : Infinity
      if (daysLeft <= 7) {
        score += 25
        reasons.push('Ending soon')
      } else if (daysLeft <= 30) {
        score += 10
        reasons.push('Ending this month')
      }

      // Verified campaigns get bonus
      if (campaign.verified) {
        score += 15
        reasons.push('Verified campaign')
      }

      // Popularity scoring
      if (campaign.donors > 50) {
        score += 10
        reasons.push('Many supporters')
      }

      if (score > 0) {
        recommendations.push({
          id: `rec_${campaign.id}_${Date.now()}`,
          userId: user.id,
          type: 'campaign',
          itemId: campaign.id,
          score,
          reason: reasons.join(', '),
          createdAt: new Date(),
        })
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Calculate Distance Between Two Coordinates (Haversine Formula)
   * 
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in miles
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert Degrees to Radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

// Singleton instance
let recommendationEngine: RecommendationEngine | null = null

/**
 * Get Recommendation Engine Instance
 * 
 * @returns RecommendationEngine
 */
export function getRecommendationEngine(): RecommendationEngine {
  if (!recommendationEngine) {
    recommendationEngine = new RecommendationEngine()
  }
  return recommendationEngine
}

