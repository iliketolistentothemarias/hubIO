/**
 * Admin Service
 * 
 * Business logic for admin operations including:
 * - Resource moderation
 * - User management
 * - Content approval
 * - System monitoring
 */

import { Resource, User } from '@/lib/types'
import { getDatabase } from '@/lib/db/schema'
import { getAuthService } from '@/lib/auth'

export class AdminService {
  private db = getDatabase()
  private auth = getAuthService()

  /**
   * Approve Resource
   * 
   * @param resourceId - Resource ID
   * @param adminId - Admin user ID
   * @returns Updated resource
   */
  async approveResource(resourceId: string, adminId: string): Promise<Resource> {
    const admin = await this.auth.getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized. Admin access required.')
    }

    const resource = this.db.getResource(resourceId)
    if (!resource) {
      throw new Error('Resource not found')
    }

    const updated: Resource = {
      ...resource,
      verified: true,
      updatedAt: new Date(),
    }

    this.db.createResource(updated)
    return updated
  }

  /**
   * Reject Resource
   * 
   * @param resourceId - Resource ID
   * @param reason - Rejection reason
   * @returns Success status
   */
  async rejectResource(resourceId: string, reason: string): Promise<boolean> {
    const admin = await this.auth.getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized. Admin access required.')
    }

    const resource = this.db.getResource(resourceId)
    if (!resource) {
      throw new Error('Resource not found')
    }

    // In production, would mark as rejected or delete
    // For demo, just return success
    return true
  }

  /**
   * Get Pending Resources
   * 
   * @returns Array of unverified resources
   */
  async getPendingResources(): Promise<Resource[]> {
    const admin = await this.auth.getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized. Admin access required.')
    }

    return this.db.getAllResources().filter(r => !r.verified)
  }

  /**
   * Get All Users
   * 
   * @returns Array of all users
   */
  async getAllUsers(): Promise<User[]> {
    const admin = await this.auth.getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized. Admin access required.')
    }

    // In production, would query actual users
    // For demo, return empty array
    return []
  }

  /**
   * Update User Role
   * 
   * @param userId - User ID
   * @param newRole - New role
   * @returns Updated user
   */
  async updateUserRole(userId: string, newRole: string): Promise<User> {
    const admin = await this.auth.getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized. Admin access required.')
    }

    const user = this.db.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const updated = this.db.updateUser(userId, { role: newRole as any })
    if (!updated) {
      throw new Error('Failed to update user')
    }

    return updated
  }

  /**
   * Get System Statistics
   * 
   * @returns System stats
   */
  async getSystemStats() {
    const admin = await this.auth.getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized. Admin access required.')
    }

    const resources = this.db.getAllResources()
    const opportunities = this.db.getAllVolunteerOpportunities()
    const campaigns = this.db.getAllCampaigns()
    const events = this.db.getUpcomingEvents()

    return {
      totalResources: resources.length,
      verifiedResources: resources.filter(r => r.verified).length,
      pendingResources: resources.filter(r => !r.verified).length,
      totalOpportunities: opportunities.length,
      activeOpportunities: opportunities.filter(o => o.status === 'active').length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      upcomingEvents: events.length,
    }
  }
}

// Singleton instance
let adminService: AdminService | null = null

/**
 * Get Admin Service Instance
 * 
 * @returns AdminService
 */
export function getAdminService(): AdminService {
  if (!adminService) {
    adminService = new AdminService()
  }
  return adminService
}

