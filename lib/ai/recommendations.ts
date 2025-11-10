/**
 * AI Recommendation Engine
 * 
 * This module provides intelligent recommendations for resources, events,
 * volunteer opportunities, and fundraising campaigns based on user behavior,
 * preferences, location, and community trends.
 * 
 * Features:
 * - Collaborative Filtering (user-based and item-based)
 * - Content-Based Filtering
 * - Hybrid Recommendation System
 * - A/B Testing Support
 * - Deep Learning Integration Ready
 * 
 * In production, this would integrate with:
 * - OpenAI API for advanced recommendations
 * - TensorFlow.js for on-device ML
 * - Custom ML models trained on community data
 */

import { User, Resource, Event, VolunteerOpportunity, FundraisingCampaign, Recommendation } from '@/lib/types'
import { getDatabase } from '@/lib/db/schema'

export interface UserSimilarity {
  userId: string
  similarity: number
}

export interface ABTestVariant {
  id: string
  name: string
  algorithm: 'collaborative' | 'content-based' | 'hybrid'
  weight: number
  active: boolean
}

/**
 * Recommendation Engine Class
 * 
 * Analyzes user data and provides personalized recommendations
 */
export class RecommendationEngine {
  private db = getDatabase()
  private abTestVariants: ABTestVariant[] = [
    { id: 'v1', name: 'Collaborative Filtering', algorithm: 'collaborative', weight: 0.3, active: true },
    { id: 'v2', name: 'Content-Based', algorithm: 'content-based', weight: 0.3, active: true },
    { id: 'v3', name: 'Hybrid', algorithm: 'hybrid', weight: 0.4, active: true },
  ]

  /**
   * Get Personalized Recommendations for User
   * 
   * @param userId - User ID
   * @param limit - Maximum number of recommendations
   * @param algorithm - Specific algorithm to use (optional, uses A/B test if not specified)
   * @returns Promise<Recommendation[]>
   */
  async getRecommendations(
    userId: string,
    limit: number = 10,
    algorithm?: 'collaborative' | 'content-based' | 'hybrid'
  ): Promise<Recommendation[]> {
    const user = this.db.getUser(userId)
    if (!user) return []

    // Select algorithm based on A/B test or specified algorithm
    const selectedAlgorithm = algorithm || this.selectABTestVariant(userId)

    let recommendations: Recommendation[] = []

    switch (selectedAlgorithm) {
      case 'collaborative':
        recommendations = await this.getCollaborativeRecommendations(userId, limit)
        break
      case 'content-based':
        recommendations = await this.getContentBasedRecommendations(user, limit)
        break
      case 'hybrid':
        recommendations = await this.getHybridRecommendations(userId, user, limit)
        break
    }

    // Track recommendation for A/B testing
    this.trackRecommendation(userId, selectedAlgorithm, recommendations)

    return recommendations
  }

  /**
   * Collaborative Filtering (User-Based)
   * 
   * Finds users similar to the target user and recommends items they liked
   */
  private async getCollaborativeRecommendations(
    userId: string,
    limit: number
  ): Promise<Recommendation[]> {
    const similarUsers = this.findSimilarUsers(userId, 10)
    const recommendations: Recommendation[] = []

    // Get items liked by similar users
    const userInteractions = this.getUserInteractions(userId)
    const similarUserInteractions = new Map<string, number>()

    for (const similarUser of similarUsers) {
      const interactions = this.getUserInteractions(similarUser.userId)
      for (const [itemId, score] of interactions.entries()) {
        if (!userInteractions.has(itemId)) {
          const currentScore = similarUserInteractions.get(itemId) || 0
          similarUserInteractions.set(
            itemId,
            currentScore + score * similarUser.similarity
          )
        }
      }
    }

    // Convert to recommendations
    for (const [itemId, score] of similarUserInteractions.entries()) {
      const [type, id] = itemId.split(':')
      recommendations.push({
        id: `rec_cf_${itemId}_${Date.now()}`,
        userId,
        type: type as any,
        itemId: id,
        score: Math.round(score * 100),
        reason: 'Recommended by users with similar interests',
        createdAt: new Date(),
      })
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Content-Based Filtering
   * 
   * Recommends items similar to items the user has interacted with
   */
  private async getContentBasedRecommendations(
    user: User,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    const userInteractions = this.getUserInteractions(user.id)

    // Get user's preferred categories and tags
    const preferences = this.extractUserPreferences(user.id, userInteractions)

    // Score resources based on content similarity
    const allResources = this.db.getAllResources()
    for (const resource of allResources) {
      if (userInteractions.has(`resource:${resource.id}`)) continue

      let score = 0
      const reasons: string[] = []

      // Category match
      if (preferences.categories.includes(resource.category)) {
        score += 40
        reasons.push('Matches your category preferences')
      }

      // Tag overlap
      const tagOverlap = resource.tags.filter(tag =>
        preferences.tags.includes(tag)
      ).length
      if (tagOverlap > 0) {
        score += tagOverlap * 10
        reasons.push(`${tagOverlap} matching tags`)
      }

      // Location proximity
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
        }
      }

      if (score > 0) {
        recommendations.push({
          id: `rec_cb_${resource.id}_${Date.now()}`,
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
   * Hybrid Recommendation System
   * 
   * Combines collaborative and content-based filtering
   */
  private async getHybridRecommendations(
    userId: string,
    user: User,
    limit: number
  ): Promise<Recommendation[]> {
    // Get recommendations from both methods
    const collaborativeRecs = await this.getCollaborativeRecommendations(userId, limit * 2)
    const contentBasedRecs = await this.getContentBasedRecommendations(user, limit * 2)

    // Combine and re-rank
    const combined = new Map<string, Recommendation>()

    // Add collaborative recommendations (weight: 0.6)
    for (const rec of collaborativeRecs) {
      const key = `${rec.type}:${rec.itemId}`
      const existing = combined.get(key)
      if (existing) {
        existing.score = Math.round(existing.score * 0.6 + rec.score * 0.6)
      } else {
        combined.set(key, { ...rec, score: Math.round(rec.score * 0.6) })
      }
    }

    // Add content-based recommendations (weight: 0.4)
    for (const rec of contentBasedRecs) {
      const key = `${rec.type}:${rec.itemId}`
      const existing = combined.get(key)
      if (existing) {
        existing.score = Math.round(existing.score + rec.score * 0.4)
        existing.reason = `${existing.reason} + ${rec.reason}`
      } else {
        combined.set(key, { ...rec, score: Math.round(rec.score * 0.4) })
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Find Similar Users (Collaborative Filtering)
   */
  private findSimilarUsers(userId: string, k: number = 10): UserSimilarity[] {
    const targetUser = this.db.getUser(userId)
    if (!targetUser) return []

    const targetInteractions = this.getUserInteractions(userId)
    const similarities: UserSimilarity[] = []

    // Get all users
    const allUsers = Array.from(this.db['users'].values() || [])
      .filter(u => u.id !== userId)

    for (const user of allUsers) {
      const userInteractions = this.getUserInteractions(user.id)
      const similarity = this.calculateCosineSimilarity(
        targetInteractions,
        userInteractions
      )

      if (similarity > 0) {
        similarities.push({
          userId: user.id,
          similarity,
        })
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
  }

  /**
   * Calculate Cosine Similarity
   */
  private calculateCosineSimilarity(
    vec1: Map<string, number>,
    vec2: Map<string, number>
  ): number {
    const allItems = new Set([...vec1.keys(), ...vec2.keys()])
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (const item of allItems) {
      const val1 = vec1.get(item) || 0
      const val2 = vec2.get(item) || 0
      dotProduct += val1 * val2
      norm1 += val1 * val1
      norm2 += val2 * val2
    }

    if (norm1 === 0 || norm2 === 0) return 0
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Get User Interactions
   * 
   * Returns a map of itemId -> interaction score
   */
  private getUserInteractions(userId: string): Map<string, number> {
    const interactions = new Map<string, number>()

    // Resources viewed/saved
    const resources = this.db.getAllResources()
    // In production, would track actual views/saves
    // For now, use favorites or other signals

    // Events RSVPed
    const registrations = this.db.getEventRegistrationsByUser(userId)
    for (const reg of registrations) {
      interactions.set(`event:${reg.eventId}`, 1)
    }

    // Volunteer applications
    const applications = this.db.getApplicationsByUser(userId)
    for (const app of applications) {
      interactions.set(`volunteer:${app.opportunityId}`, 1)
    }

    // Donations
    const donations = this.db.getDonationsByUser(userId)
    for (const donation of donations) {
      interactions.set(`campaign:${donation.campaignId}`, donation.amount / 100) // Normalize
    }

    return interactions
  }

  /**
   * Extract User Preferences
   */
  private extractUserPreferences(
    userId: string,
    interactions: Map<string, number>
  ): { categories: string[]; tags: string[] } {
    const categories = new Set<string>()
    const tags = new Set<string>()

    // Analyze interactions to extract preferences
    for (const [itemId] of interactions.entries()) {
      const [type, id] = itemId.split(':')
      
      if (type === 'resource') {
        const resource = this.db.getResource(id)
        if (resource) {
          categories.add(resource.category)
          resource.tags.forEach(tag => tags.add(tag))
        }
      } else if (type === 'event') {
        const event = this.db.getEvent(id)
        if (event) {
          categories.add(event.category)
          event.tags.forEach(tag => tags.add(tag))
        }
      }
    }

    return {
      categories: Array.from(categories),
      tags: Array.from(tags),
    }
  }

  /**
   * Select A/B Test Variant
   */
  private selectABTestVariant(userId: string): 'collaborative' | 'content-based' | 'hybrid' {
    const activeVariants = this.abTestVariants.filter(v => v.active)
    if (activeVariants.length === 0) return 'hybrid'

    // Use user ID hash for consistent assignment
    const hash = this.hashUserId(userId)
    const random = hash % 100

    let cumulative = 0
    for (const variant of activeVariants) {
      cumulative += variant.weight * 100
      if (random < cumulative) {
        return variant.algorithm
      }
    }

    return activeVariants[activeVariants.length - 1].algorithm
  }

  /**
   * Hash User ID for A/B Testing
   */
  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Track Recommendation for A/B Testing
   */
  private trackRecommendation(
    userId: string,
    algorithm: string,
    recommendations: Recommendation[]
  ): void {
    // In production, would log to analytics service
    // For now, store in recommendations table
    for (const rec of recommendations) {
      this.db['recommendations'].set(rec.id, {
        ...rec,
        metadata: {
          algorithm,
          abTestVariant: this.selectABTestVariant(userId),
        },
      })
    }
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

