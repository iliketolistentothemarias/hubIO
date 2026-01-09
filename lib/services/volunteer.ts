/**
 * Volunteer Service
 * 
 * Business logic for volunteer operations including:
 * - Application management
 * - Hours tracking
 * - Achievement calculation
 * - Impact metrics
 */

import { VolunteerApplication, VolunteerOpportunity } from '@/lib/types'
import { getDatabase } from '@/lib/db/schema'

export class VolunteerService {
  private db = getDatabase()

  /**
   * Apply to Volunteer Opportunity
   * 
   * @param userId - User ID
   * @param opportunityId - Opportunity ID
   * @returns VolunteerApplication
   */
  applyToOpportunity(userId: string, opportunityId: string): VolunteerApplication {
    const opportunity = this.db.getVolunteerOpportunity(opportunityId)
    
    if (!opportunity) {
      throw new Error('Opportunity not found')
    }

    if (opportunity.status !== 'active') {
      throw new Error('Opportunity is not active')
    }

    if (opportunity.volunteersSignedUp >= opportunity.volunteersNeeded) {
      throw new Error('Opportunity is full')
    }

    // Create application
    const application: VolunteerApplication = {
      id: `app_${Date.now()}`,
      opportunityId,
      userId,
      status: 'pending',
      appliedAt: new Date(),
    }

    // Update opportunity
    const updated = {
      ...opportunity,
      volunteersSignedUp: opportunity.volunteersSignedUp + 1,
      updatedAt: new Date(),
    }
    this.db.createVolunteerOpportunity(updated)

    return application
  }

  /**
   * Get Volunteer Hours for User
   * 
   * @param userId - User ID
   * @returns Total hours volunteered
   */
  getVolunteerHours(userId: string): number {
    const applications = this.db.getApplicationsByUser(userId)
    return applications
      .filter(app => app.status === 'completed' && app.hoursCompleted)
      .reduce((sum, app) => sum + (app.hoursCompleted || 0), 0)
  }

  /**
   * Get Completed Opportunities for User
   * 
   * @param userId - User ID
   * @returns Number of completed opportunities
   */
  getCompletedOpportunities(userId: string): number {
    const applications = this.db.getApplicationsByUser(userId)
    return applications.filter(app => app.status === 'completed').length
  }

  /**
   * Get Active Applications for User
   * 
   * @param userId - User ID
   * @returns Active applications
   */
  getActiveApplications(userId: string): VolunteerApplication[] {
    const applications = this.db.getApplicationsByUser(userId)
    return applications.filter(
      app => app.status === 'pending' || app.status === 'approved'
    )
  }

  /**
   * Calculate Impact Score
   * 
   * @param userId - User ID
   * @returns Impact score based on hours and opportunities
   */
  calculateImpactScore(userId: string): number {
    const hours = this.getVolunteerHours(userId)
    const opportunities = this.getCompletedOpportunities(userId)
    
    // Simple scoring: hours * 2 + opportunities * 10
    return (hours * 2) + (opportunities * 10)
  }
}

// Singleton instance
let volunteerService: VolunteerService | null = null

/**
 * Get Volunteer Service Instance
 * 
 * @returns VolunteerService
 */
export function getVolunteerService(): VolunteerService {
  if (!volunteerService) {
    volunteerService = new VolunteerService()
  }
  return volunteerService
}

