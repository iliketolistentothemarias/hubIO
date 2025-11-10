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
  Post,
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
  volunteerOpportunities: Map<string, VolunteerOpportunity>
  volunteerApplications: Map<string, VolunteerApplication>
  employmentOpportunities: Map<string, any>
  fundraisingCampaigns: Map<string, FundraisingCampaign>
  donations: Map<string, Donation>
  events: Map<string, Event>
  eventRegistrations: Map<string, EventRegistration>
  eventWaitlist: Map<string, EventRegistration>
  posts: Map<string, Post>
  badges: Map<string, Badge>
  recommendations: Map<string, any>
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
  postsByCategory: Map<string, string[]>
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
    volunteerOpportunities: new Map(),
    volunteerApplications: new Map(),
    employmentOpportunities: new Map(),
    fundraisingCampaigns: new Map(),
    donations: new Map(),
    events: new Map(),
    eventRegistrations: new Map(),
    eventWaitlist: new Map(),
    posts: new Map(),
    badges: new Map(),
    recommendations: new Map(),
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
    postsByCategory: new Map(),
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
        if (data.volunteerOpportunities) this.db.volunteerOpportunities = new Map(data.volunteerOpportunities)
        if (data.employmentOpportunities) this.db.employmentOpportunities = new Map(data.employmentOpportunities)
        if (data.fundraisingCampaigns) this.db.fundraisingCampaigns = new Map(data.fundraisingCampaigns)
        if (data.donations) this.db.donations = new Map(data.donations)
        if (data.events) this.db.events = new Map(data.events)
        if (data.posts) this.db.posts = new Map(data.posts)
        if (data.badges) this.db.badges = new Map(data.badges)
        if (data.recommendations) this.db.recommendations = new Map(data.recommendations)
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
  // VOLUNTEER APPLICATION OPERATIONS
  // ========================================================================

  createVolunteerApplication(application: VolunteerApplication): VolunteerApplication {
    this.db.volunteerApplications.set(application.id, application)
    this.saveToStorage()
    return application
  }

  getVolunteerApplication(id: string): VolunteerApplication | undefined {
    return this.db.volunteerApplications.get(id)
  }

  getApplicationsByUser(userId: string): VolunteerApplication[] {
    const applications: VolunteerApplication[] = []
    for (const application of this.db.volunteerApplications.values()) {
      if (application.userId === userId) {
        applications.push(application)
      }
    }
    return applications.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
  }

  getApplicationsByOpportunity(opportunityId: string): VolunteerApplication[] {
    const applications: VolunteerApplication[] = []
    for (const application of this.db.volunteerApplications.values()) {
      if (application.opportunityId === opportunityId) {
        applications.push(application)
      }
    }
    return applications.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
  }

  updateVolunteerApplication(
    id: string,
    updates: Partial<VolunteerApplication>
  ): VolunteerApplication | undefined {
    const application = this.db.volunteerApplications.get(id)
    if (!application) return undefined

    const updated = {
      ...application,
      ...updates,
      reviewedAt: updates.status !== application.status ? new Date() : application.reviewedAt,
    }
    this.db.volunteerApplications.set(id, updated)
    this.saveToStorage()
    return updated
  }

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
  // ========================================================================

  createEventRegistration(registration: EventRegistration): EventRegistration {
    this.db.eventRegistrations.set(registration.id, registration)
    this.saveToStorage()
    return registration
  }

  getEventRegistration(eventId: string, userId: string): EventRegistration | undefined {
    for (const reg of this.db.eventRegistrations.values()) {
      if (reg.eventId === eventId && reg.userId === userId) {
        return reg
      }
    }
    return undefined
  }

  getEventRegistrationsByUser(userId: string): EventRegistration[] {
    const registrations: EventRegistration[] = []
    for (const reg of this.db.eventRegistrations.values()) {
      if (reg.userId === userId) {
        registrations.push(reg)
      }
    }
    return registrations.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
  }

  getEventRegistrationsByEvent(eventId: string): EventRegistration[] {
    const registrations: EventRegistration[] = []
    for (const reg of this.db.eventRegistrations.values()) {
      if (reg.eventId === eventId) {
        registrations.push(reg)
      }
    }
    return registrations.sort((a, b) => a.registeredAt.getTime() - b.registeredAt.getTime())
  }

  deleteEventRegistration(eventId: string, userId: string): boolean {
    for (const [id, reg] of this.db.eventRegistrations.entries()) {
      if (reg.eventId === eventId && reg.userId === userId) {
        this.db.eventRegistrations.delete(id)
        this.saveToStorage()
        return true
      }
    }
    return false
  }

  updateEventRegistration(
    id: string,
    updates: Partial<EventRegistration>
  ): EventRegistration | undefined {
    const registration = this.db.eventRegistrations.get(id)
    if (!registration) return undefined

    const updated = { ...registration, ...updates }
    this.db.eventRegistrations.set(id, updated)
    this.saveToStorage()
    return updated
  }

  // ========================================================================
  // EVENT WAITLIST OPERATIONS
  // ========================================================================

  addToWaitlist(registration: EventRegistration): EventRegistration {
    this.db.eventWaitlist.set(registration.id, registration)
    this.saveToStorage()
    return registration
  }

  getWaitlistByEvent(eventId: string): EventRegistration[] {
    const waitlist: EventRegistration[] = []
    for (const reg of this.db.eventWaitlist.values()) {
      if (reg.eventId === eventId) {
        waitlist.push(reg)
      }
    }
    return waitlist.sort((a, b) => a.registeredAt.getTime() - b.registeredAt.getTime())
  }

  removeFromWaitlist(eventId: string, userId: string): boolean {
    for (const [id, reg] of this.db.eventWaitlist.entries()) {
      if (reg.eventId === eventId && reg.userId === userId) {
        this.db.eventWaitlist.delete(id)
        this.saveToStorage()
        return true
      }
    }
    return false
  }

  promoteFromWaitlist(eventId: string): EventRegistration | null {
    const waitlist = this.getWaitlistByEvent(eventId)
    if (waitlist.length === 0) return null

    const firstInLine = waitlist[0]
    this.removeFromWaitlist(eventId, firstInLine.userId)
    
    // Create actual registration
    const registration: EventRegistration = {
      ...firstInLine,
      id: `reg_${Date.now()}`,
      status: 'registered',
    }
    this.createEventRegistration(registration)
    
    return registration
  }

  // ========================================================================
  // POST OPERATIONS
  // ========================================================================

  createPost(post: Post): Post {
    this.db.posts.set(post.id, post)
    this.updatePostIndexes(post)
    this.saveToStorage()
    return post
  }

  getPost(id: string): Post | undefined {
    return this.db.posts.get(id)
  }

  getPostsByCategory(category: string): Post[] {
    const ids = this.indexes.postsByCategory.get(category) || []
    return ids.map(id => this.db.posts.get(id)).filter(Boolean) as Post[]
  }

  getAllPosts(): Post[] {
    return Array.from(this.db.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  private updatePostIndexes(post: Post): void {
    const categoryIds = this.indexes.postsByCategory.get(post.category) || []
    if (!categoryIds.includes(post.id)) {
      categoryIds.push(post.id)
      this.indexes.postsByCategory.set(post.category, categoryIds)
    }
  }

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

  // ========================================================================
  // MODERATION OPERATIONS
  // ========================================================================

  createModerationAction(action: ModerationAction): ModerationAction {
    this.db.moderationActions.set(action.id, action)
    this.saveToStorage()
    return action
  }

  getModerationActionsByItem(itemId: string, type: string): ModerationAction[] {
    const actions: ModerationAction[] = []
    for (const action of this.db.moderationActions.values()) {
      if (action.itemId === itemId && action.type === type) {
        actions.push(action)
      }
    }
    return actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getModerationActionsByAdmin(adminId: string): ModerationAction[] {
    const actions: ModerationAction[] = []
    for (const action of this.db.moderationActions.values()) {
      if (action.adminId === adminId) {
        actions.push(action)
      }
    }
    return actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  createContentFlag(flag: ContentFlag): ContentFlag {
    this.db.contentFlags.set(flag.id, flag)
    this.saveToStorage()
    return flag
  }

  getContentFlags(status?: string): ContentFlag[] {
    const flags: ContentFlag[] = []
    for (const flag of this.db.contentFlags.values()) {
      if (!status || flag.status === status) {
        flags.push(flag)
      }
    }
    return flags.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  updateContentFlag(id: string, updates: Partial<ContentFlag>): ContentFlag | undefined {
    const flag = this.db.contentFlags.get(id)
    if (!flag) return undefined

    const updated = { ...flag, ...updates }
    this.db.contentFlags.set(id, updated)
    this.saveToStorage()
    return updated
  }

  createModerationRule(rule: ModerationRule): ModerationRule {
    this.db.moderationRules.set(rule.id, rule)
    this.saveToStorage()
    return rule
  }

  getAllModerationRules(): ModerationRule[] {
    return Array.from(this.db.moderationRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority)
  }

  updateModerationRule(id: string, updates: Partial<ModerationRule>): ModerationRule | undefined {
    const rule = this.db.moderationRules.get(id)
    if (!rule) return undefined

    const updated = { ...rule, ...updates, updatedAt: new Date() }
    this.db.moderationRules.set(id, updated)
    this.saveToStorage()
    return updated
  }

  // ========================================================================
  // MARKETPLACE OPERATIONS
  // ========================================================================

  createVendor(vendor: Vendor): Vendor {
    this.db.vendors.set(vendor.id, vendor)
    this.saveToStorage()
    return vendor
  }

  getVendor(id: string): Vendor | undefined {
    return this.db.vendors.get(id)
  }

  getAllVendors(): Vendor[] {
    return Array.from(this.db.vendors.values())
  }

  createProduct(product: Product): Product {
    this.db.products.set(product.id, product)
    this.saveToStorage()
    return product
  }

  getProduct(id: string): Product | undefined {
    return this.db.products.get(id)
  }

  getProductsByVendor(vendorId: string): Product[] {
    const products: Product[] = []
    for (const product of this.db.products.values()) {
      if (product.vendorId === vendorId) {
        products.push(product)
      }
    }
    return products
  }

  getAllProducts(): Product[] {
    return Array.from(this.db.products.values())
  }

  createShoppingCart(cart: ShoppingCart): ShoppingCart {
    this.db.shoppingCarts.set(cart.id, cart)
    this.saveToStorage()
    return cart
  }

  getShoppingCart(userId: string): ShoppingCart | undefined {
    for (const cart of this.db.shoppingCarts.values()) {
      if (cart.userId === userId) {
        return cart
      }
    }
    return undefined
  }

  updateShoppingCart(userId: string, updates: Partial<ShoppingCart>): ShoppingCart | undefined {
    const cart = this.getShoppingCart(userId)
    if (!cart) return undefined

    const updated = { ...cart, ...updates, updatedAt: new Date() }
    this.db.shoppingCarts.set(cart.id, updated)
    this.saveToStorage()
    return updated
  }

  createOrder(order: Order): Order {
    this.db.orders.set(order.id, order)
    this.saveToStorage()
    return order
  }

  getOrder(id: string): Order | undefined {
    return this.db.orders.get(id)
  }

  getOrdersByUser(userId: string): Order[] {
    const orders: Order[] = []
    for (const order of this.db.orders.values()) {
      if (order.userId === userId) {
        orders.push(order)
      }
    }
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getOrdersByVendor(vendorId: string): Order[] {
    const orders: Order[] = []
    for (const order of this.db.orders.values()) {
      if (order.vendorId === vendorId) {
        orders.push(order)
      }
    }
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  createCommission(commission: Commission): Commission {
    this.db.commissions.set(commission.id, commission)
    this.saveToStorage()
    return commission
  }

  getCommissionsByVendor(vendorId: string): Commission[] {
    const commissions: Commission[] = []
    for (const commission of this.db.commissions.values()) {
      if (commission.vendorId === vendorId) {
        commissions.push(commission)
      }
    }
    return commissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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

