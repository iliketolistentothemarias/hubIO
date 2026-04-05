/**
 * Database Schema
 * 
 * This file defines the database schema using a schema-first approach.
 * In production, this would be used with Prisma, Drizzle, or similar ORM.
 * 
 * For TSA competition, we'll use a mock database with localStorage/IndexedDB
 * or a simple JSON file structure that simulates a real database.
 */

import { 
  User, 
  Resource, 
  VolunteerOpportunity, 
  FundraisingCampaign, 
  Event, 
  Donation,
  Badge,
  VolunteerApplication,
  EventRegistration
} from '@/lib/types'

/**
 * Database Tables Structure
 * 
 * In a real application, these would be actual database tables.
 * For this implementation, we'll use in-memory storage with persistence.
 */

import { ModerationAction, ContentFlag, ModerationRule } from '@/lib/types/moderation'
import { Vendor, Product, ShoppingCart, Order, Commission } from '@/lib/types/marketplace'

export interface Database {
  users: Map<string, User>
  resources: Map<string, Resource>
  employmentOpportunities: Map<string, any>
  fundraisingCampaigns: Map<string, FundraisingCampaign>
  donations: Map<string, Donation>
  events: Map<string, Event>
  eventRegistrations: Map<string, EventRegistration>
  eventWaitlist: Map<string, EventRegistration>
  badges: Map<string, Badge>
  moderationActions: Map<string, ModerationAction>
  contentFlags: Map<string, ContentFlag>
  moderationRules: Map<string, ModerationRule>
  vendors: Map<string, Vendor>
  products: Map<string, Product>
  shoppingCarts: Map<string, ShoppingCart>
  orders: Map<string, Order>
  commissions: Map<string, Commission>
  tenants: Map<string, any>
  tenantUsers: Map<string, any>
  subscriptions: Map<string, any>
  usage: Map<string, any>
  apiKeys: Map<string, any>
  apiUsage: Map<string, any>
}

/**
 * Database Indexes
 * 
 * These indexes help with fast lookups and queries
 */
export interface DatabaseIndexes {
  resourcesByCategory: Map<string, string[]>
  resourcesByLocation: Map<string, string[]>
  eventsByDate: Map<string, string[]>
  userBadges: Map<string, string[]>
}

/**
 * Initialize Database
 * 
 * Creates a new database instance with all tables
 */
export function initializeDatabase(): Database {
  return {
    users: new Map(),
    resources: new Map(),
    employmentOpportunities: new Map(),
    fundraisingCampaigns: new Map(),
    donations: new Map(),
    events: new Map(),
    eventRegistrations: new Map(),
    eventWaitlist: new Map(),
    badges: new Map(),
    moderationActions: new Map(),
    contentFlags: new Map(),
    moderationRules: new Map(),
    vendors: new Map(),
    products: new Map(),
    shoppingCarts: new Map(),
    orders: new Map(),
    commissions: new Map(),
    tenants: new Map(),
    tenantUsers: new Map(),
    subscriptions: new Map(),
    usage: new Map(),
    apiKeys: new Map(),
    apiUsage: new Map(),
  }
}

/**
 * Initialize Indexes
 * 
 * Creates indexes for fast queries
 */
export function initializeIndexes(): DatabaseIndexes {
  return {
    resourcesByCategory: new Map(),
    resourcesByLocation: new Map(),
    eventsByDate: new Map(),
    userBadges: new Map(),
  }
}

/**
 * Database Helper Functions
 * 
 * These functions provide a clean API for database operations
 */

export class DatabaseService {
  private db: Database
  private indexes: DatabaseIndexes

  constructor() {
    this.db = initializeDatabase()
    this.indexes = initializeIndexes()
    this.loadFromStorage()
  }

  /**
   * Load data from localStorage (simulates database persistence)
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('hubio_db')
      if (stored) {
        const data = JSON.parse(stored)
        // Reconstruct Maps from stored data
        if (data.users) this.db.users = new Map(data.users)
        if (data.resources) this.db.resources = new Map(data.resources)
        if (data.employmentOpportunities) this.db.employmentOpportunities = new Map(data.employmentOpportunities)
        if (data.fundraisingCampaigns) this.db.fundraisingCampaigns = new Map(data.fundraisingCampaigns)
        if (data.donations) this.db.donations = new Map(data.donations)
        if (data.events) this.db.events = new Map(data.events)
        if (data.badges) this.db.badges = new Map(data.badges)
      }
    } catch (error) {
      console.error('Failed to load database from storage:', error)
    }
  }

  /**
   * Save data to localStorage (simulates database persistence)
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data: any = {}
      Object.keys(this.db).forEach((key) => {
        data[key] = Array.from(this.db[key as keyof Database].entries())
      })
      localStorage.setItem('hubio_db', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save database to storage:', error)
    }
  }

  // ========================================================================
  // USER OPERATIONS
  // ========================================================================

  createUser(user: User): User {
    this.db.users.set(user.id, user)
    this.saveToStorage()
    return user
  }

  getUser(id: string): User | undefined {
    return this.db.users.get(id)
  }

  getUserByEmail(email: string): User | undefined {
    for (const user of this.db.users.values()) {
      if (user.email === email) return user
    }
    return undefined
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.db.users.get(id)
    if (!user) return undefined

    const updated = { ...user, ...updates, updatedAt: new Date() }
    this.db.users.set(id, updated)
    this.saveToStorage()
    return updated
  }

  getAllUsers(): User[] {
    return Array.from(this.db.users.values())
  }

  // ========================================================================
  // RESOURCE OPERATIONS
  // ========================================================================

  createResource(resource: Resource): Resource {
    this.db.resources.set(resource.id, resource)
    this.updateResourceIndexes(resource)
    this.saveToStorage()
    return resource
  }

  getResource(id: string): Resource | undefined {
    return this.db.resources.get(id)
  }

  getResourcesByCategory(category: string): Resource[] {
    const ids = this.indexes.resourcesByCategory.get(category) || []
    return ids.map(id => this.db.resources.get(id)).filter(Boolean) as Resource[]
  }

  searchResources(query: string): Resource[] {
    const results: Resource[] = []
    const lowerQuery = query.toLowerCase()

    for (const resource of this.db.resources.values()) {
      if (
        resource.name.toLowerCase().includes(lowerQuery) ||
        resource.description.toLowerCase().includes(lowerQuery) ||
        resource.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push(resource)
      }
    }

    return results
  }

  private updateResourceIndexes(resource: Resource): void {
    // Update category index
    const categoryIds = this.indexes.resourcesByCategory.get(resource.category) || []
    if (!categoryIds.includes(resource.id)) {
      categoryIds.push(resource.id)
      this.indexes.resourcesByCategory.set(resource.category, categoryIds)
    }
  }

  // ========================================================================
  // VOLUNTEER OPPORTUNITY OPERATIONS
  // ========================================================================

  createVolunteerOpportunity(opportunity: VolunteerOpportunity): VolunteerOpportunity {
    this.db.volunteerOpportunities.set(opportunity.id, opportunity)
    this.saveToStorage()
    return opportunity
  }

  getVolunteerOpportunity(id: string): VolunteerOpportunity | undefined {
    return this.db.volunteerOpportunities.get(id)
  }

  getAllVolunteerOpportunities(): VolunteerOpportunity[] {
    return Array.from(this.db.volunteerOpportunities.values())
  }

  // ========================================================================
  // RESOURCE OPERATIONS
  // ========================================================================

  /**
   * Get All Resources
   * 
   * @returns Resource[]
   */
  getAllResources(): Resource[] {
    return Array.from(this.db.resources.values())
  }

  // ========================================================================
  // FUNDRAISING CAMPAIGN OPERATIONS
  // ========================================================================

  createCampaign(campaign: FundraisingCampaign): FundraisingCampaign {
    this.db.fundraisingCampaigns.set(campaign.id, campaign)
    this.saveToStorage()
    return campaign
  }

  getCampaign(id: string): FundraisingCampaign | undefined {
    return this.db.fundraisingCampaigns.get(id)
  }

  getAllCampaigns(): FundraisingCampaign[] {
    return Array.from(this.db.fundraisingCampaigns.values())
  }

  updateCampaign(id: string, updates: Partial<FundraisingCampaign>): FundraisingCampaign | undefined {
    const campaign = this.db.fundraisingCampaigns.get(id)
    if (!campaign) return undefined

    const updated = { ...campaign, ...updates, updatedAt: new Date() }
    this.db.fundraisingCampaigns.set(id, updated)
    this.saveToStorage()
    return updated
  }

  // ========================================================================
  // DONATION OPERATIONS
  // ========================================================================

  createDonation(donation: Donation): Donation {
    this.db.donations.set(donation.id, donation)
    
    // Update campaign raised amount
    const campaign = this.getCampaign(donation.campaignId)
    if (campaign) {
      this.updateCampaign(donation.campaignId, {
        raised: campaign.raised + donation.amount,
        donors: campaign.donors + 1,
      })
    }

    this.saveToStorage()
    return donation
  }

  getDonationsByCampaign(campaignId: string): Donation[] {
    const donations: Donation[] = []
    for (const donation of this.db.donations.values()) {
      if (donation.campaignId === campaignId) {
        donations.push(donation)
      }
    }
    return donations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getDonationsByUser(userId: string): Donation[] {
    const donations: Donation[] = []
    for (const donation of this.db.donations.values()) {
      if (donation.userId === userId) {
        donations.push(donation)
      }
    }
    return donations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getDonation(id: string): Donation | undefined {
    return this.db.donations.get(id)
  }

  getAllDonations(): Donation[] {
    return Array.from(this.db.donations.values())
  }

  // ========================================================================
  // EVENT OPERATIONS
  // ========================================================================

  createEvent(event: Event): Event {
    this.db.events.set(event.id, event)
    this.updateEventIndexes(event)
    this.saveToStorage()
    return event
  }

  getEvent(id: string): Event | undefined {
    return this.db.events.get(id)
  }

  getUpcomingEvents(limit?: number): Event[] {
    const now = new Date()
    const upcoming = Array.from(this.db.events.values())
      .filter(event => event.date > now && event.status === 'upcoming')
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    
    return limit ? upcoming.slice(0, limit) : upcoming
  }

  private updateEventIndexes(event: Event): void {
    const dateKey = event.date.toISOString().split('T')[0]
    const dateIds = this.indexes.eventsByDate.get(dateKey) || []
    if (!dateIds.includes(event.id)) {
      dateIds.push(event.id)
      this.indexes.eventsByDate.set(dateKey, dateIds)
    }
  }

  // ========================================================================
  // EVENT REGISTRATION OPERATIONS
  // =================================================================  }

  // ========================================================================
  // BADGE OPERATIONS
  // ========================================================================

  createBadge(badge: Badge): Badge {
    this.db.badges.set(badge.id, badge)
    this.saveToStorage()
    return badge
  }

  getBadge(id: string): Badge | undefined {
    return this.db.badges.get(id)
  }

  getAllBadges(): Badge[] {
    return Array.from(this.db.badges.values())
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null

/**
 * Get Database Instance
 * 
 * Returns a singleton instance of the database service
 */
export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService()
  }
  return dbInstance
}

