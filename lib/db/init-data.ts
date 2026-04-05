/**
 * Initialize Database with Sample Data
 * 
 * This file populates the database with comprehensive sample data
 * for resources, events, volunteer opportunities, and fundraising campaigns.
 */

import { Resource, Event, VolunteerOpportunity, FundraisingCampaign } from '@/lib/types'
import { getDatabase } from './schema'
import { allResources as sampleResources } from '@/data/resources'

// Import additional data files
import { events } from '@/data/events'
import { volunteerOpportunities } from '@/data/volunteer-opportunities'
import { fundraisingCampaigns } from '@/data/fundraising-campaigns'

/**
 * Initialize Database with All Sample Data
 */
export function initializeDatabaseData() {
  if (typeof window === 'undefined') return // Server-side only
  
  const db = getDatabase()
  
  // Check if already initialized
  const existingResources = db.getAllResources()
  if (existingResources.length >= 30) {
    return // Already initialized with enough data
  }
  
  // Initialize Resources (only if not already in database)
  if (existingResources.length === 0) {
    sampleResources.forEach(resource => {
      db.createResource(resource)
    })
  }
  
  // Initialize Events (only if not already in database)
  const allEvents = Array.from((db as any).db.events.values())
  if (allEvents.length === 0) {
    events.forEach(event => {
      db.createEvent(event)
    })
  }
  
  // Initialize Volunteer Opportunities (only if not already in database)
  const existingVolunteers = db.getAllVolunteerOpportunities()
  if (existingVolunteers.length === 0) {
    volunteerOpportunities.forEach(opportunity => {
      db.createVolunteerOpportunity(opportunity)
    })
  }
  
  // Initialize Fundraising Campaigns (only if not already in database)
  const existingCampaigns = db.getAllCampaigns()
  if (existingCampaigns.length === 0) {
    fundraisingCampaigns.forEach(campaign => {
      db.createCampaign(campaign)
    })
  }
  
  // Initialize Posts (only if not already in database)
  const existingPosts = db.getAllPosts()
  if (existingPosts.length === 0) {
    try {
      const { seedPosts } = require('@/data/seed-data')
      seedPosts.forEach((post: any) => {
        db.createPost({
          ...post,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })
    } catch (error) {
      console.warn('Could not load seed posts:', error)
    }
  }
  
  console.log('✅ Database initialized with sample data')
  console.log(`   - ${db.getAllResources().length} resources`)
  console.log(`   - ${Array.from((db as any).db.events.values()).length} events`)
  console.log(`   - ${db.getAllVolunteerOpportunities().length} volunteer opportunities`)
  console.log(`   - ${db.getAllCampaigns().length} fundraising campaigns`)
  console.log(`   - ${db.getAllPosts().length} posts`)
}

// Auto-initialize on client-side
if (typeof window !== 'undefined') {
  // Run after a short delay to ensure database is ready
  setTimeout(() => {
    initializeDatabaseData()
  }, 500)
}

