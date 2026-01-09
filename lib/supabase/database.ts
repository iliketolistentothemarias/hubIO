import { supabase } from './client'
import { Resource, Event, FundraisingCampaign, EventRegistration } from '@/lib/types'
/**
 * Supabase Database Service
 * Modular database operations using Supabase
 */

export class SupabaseDatabase {
  // ============================================================================
  // RESOURCES
  // ============================================================================
  
  async getAllResources(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching resources:', error)
      return []
    }
    
    return this.mapResourcesFromSupabase(data || [])
  }

  async getResourceById(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    
    return this.mapResourceFromSupabase(data)
  }

  async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        name: resource.name,
        category: resource.category,
        description: resource.description,
        address: resource.address,
        location: resource.location,
        phone: resource.phone,
        email: resource.email,
        website: resource.website,
        tags: resource.tags,
        featured: resource.featured,
        verified: resource.verified,
        rating: resource.rating,
        review_count: resource.reviewCount,
        hours: resource.hours,
        services: resource.services,
        capacity: resource.capacity,
        languages: resource.languages,
        accessibility: resource.accessibility,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.mapResourceFromSupabase(data)
  }

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .update({
        name: updates.name,
        category: updates.category,
        description: updates.description,
        address: updates.address,
        location: updates.location,
        phone: updates.phone,
        email: updates.email,
        website: updates.website,
        tags: updates.tags,
        featured: updates.featured,
        verified: updates.verified,
        rating: updates.rating,
        review_count: updates.reviewCount,
        hours: updates.hours,
        services: updates.services,
        capacity: updates.capacity,
        languages: updates.languages,
        accessibility: updates.accessibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error || !data) return null
    
    return this.mapResourceFromSupabase(data)
  }

  async deleteResource(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    
    return !error
  }

  // ============================================================================
  // FUNDRAISING CAMPAIGNS
  // ============================================================================
  
  async getAllCampaigns(): Promise<FundraisingCampaign[]> {
    const { data, error } = await supabase
      .from('fundraising_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      // Suppress "table not found" errors - table may not exist yet
      if (error.code !== 'PGRST205') {
        console.error('Error fetching campaigns:', error)
      }
      return []
    }
    
    return this.mapCampaignsFromSupabase(data || [])
  }

  async getCampaignById(id: string): Promise<FundraisingCampaign | null> {
    const { data, error } = await supabase
      .from('fundraising_campaigns')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    
    return this.mapCampaignFromSupabase(data)
  }

  async createCampaign(campaign: Omit<FundraisingCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<FundraisingCampaign> {
    const { data, error } = await supabase
      .from('fundraising_campaigns')
      .insert({
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        goal: campaign.goal,
        raised: campaign.raised,
        donors: campaign.donors,
        organizer: campaign.organizer,
        organizer_id: campaign.organizerId,
        location: campaign.location,
        deadline: campaign.deadline?.toISOString(),
        status: campaign.status,
        tags: campaign.tags,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.mapCampaignFromSupabase(data)
  }

  async updateCampaign(id: string, updates: Partial<FundraisingCampaign>): Promise<FundraisingCampaign | null> {
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.goal !== undefined) updateData.goal = updates.goal
    if (updates.raised !== undefined) updateData.raised = updates.raised
    if (updates.donors !== undefined) updateData.donors = updates.donors
    if (updates.organizer !== undefined) updateData.organizer = updates.organizer
    if (updates.organizerId !== undefined) updateData.organizer_id = updates.organizerId
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline?.toISOString()
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.tags !== undefined) updateData.tags = updates.tags
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('fundraising_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error || !data) return null
    
    return this.mapCampaignFromSupabase(data)
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('fundraising_campaigns')
      .delete()
      .eq('id', id)
    
    return !error
  }

  // ============================================================================
  // EVENTS
  // ============================================================================
  
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
    
    if (error) {
      // Suppress "table not found" errors - table may not exist yet
      if (error.code !== 'PGRST205') {
        console.error('Error fetching events:', error)
      }
      return []
    }
    
    return this.mapEventsFromSupabase(data || [])
  }

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: event.name,
        description: event.description,
        category: event.category,
        date: event.date.toISOString(),
        time: event.time,
        location: event.location,
        organizer: event.organizer,
        organizer_id: event.organizerId,
        capacity: event.capacity,
        registered: event.registered,
        rsvp_required: event.rsvpRequired,
        tags: event.tags,
        status: event.status,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.mapEventFromSupabase(data)
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.date !== undefined) updateData.date = updates.date.toISOString()
    if (updates.time !== undefined) updateData.time = updates.time
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.organizer !== undefined) updateData.organizer = updates.organizer
    if (updates.organizerId !== undefined) updateData.organizer_id = updates.organizerId
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity
    if (updates.registered !== undefined) updateData.registered = updates.registered
    if (updates.rsvpRequired !== undefined) updateData.rsvp_required = updates.rsvpRequired
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.status !== undefined) updateData.status = updates.status
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error || !data) return null
    
    return this.mapEventFromSupabase(data)
  }

  async deleteEvent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    return !error
  }

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    
    return this.mapEventFromSupabase(data)
  }

  // =====================================================================      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.mapEventRegistrationFromSupabase(data)
  }

  async getEventRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error || !data) return null
    
    return this.mapEventRegistrationFromSupabase(data)
  }

  async getEventRegistrationsByUser(userId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching event registrations:', error)
      return []
    }
    
    return (data || []).map(reg => this.mapEventRegistrationFromSupabase(reg))
  }

  async getEventRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching event registrations:', error)
      return []
    }
    
    return (data || []).map(reg => this.mapEventRegistrationFromSupabase(reg))
  }

  async deleteEventRegistration(eventId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
    
    return !error
  }

  private mapEventRegistrationFromSupabase(data: any): EventRegistration {
    return {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      status: data.status,
      registeredAt: new Date(data.registered_at),
    }
  }

  // ============================================================================
  // MAPPING FUNCTIONS
  // ============================================================================
  
  private mapResourcesFromSupabase(data: any[]): Resource[] {
    return data.map(item => this.mapResourceFromSupabase(item))
  }

  private mapResourceFromSupabase(item: any): Resource {
    return {
      id: item.id,
      name: item.name,
      category: item.category as any,
      description: item.description,
      address: item.address,
      location: item.location,
      phone: item.phone,
      email: item.email,
      website: item.website,
      tags: item.tags || [],
      featured: item.featured || false,
      verified: item.verified || false,
      rating: item.rating,
      reviewCount: item.review_count,
      hours: item.hours,
      services: item.services,
      capacity: item.capacity,
      languages: item.languages,
      accessibility: item.accessibility,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }
  }

  private mapCampaignsFromSupabase(data: any[]): FundraisingCampaign[] {
    return data.map(item => this.mapCampaignFromSupabase(item))
  }

  private mapCampaignFromSupabase(item: any): FundraisingCampaign {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      goal: item.goal,
      raised: item.raised,
      donors: item.donors,
      organizer: item.organizer,
      organizerId: item.organizer_id,
      location: item.location,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      status: item.status as any,
      tags: item.tags || [],
      createdAt: new Date(item.created_at),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
    }
  }

  private mapEventsFromSupabase(data: any[]): Event[] {
    return data.map(item => this.mapEventFromSupabase(item))
  }

  private mapEventFromSupabase(item: any): Event {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      date: new Date(item.date),
      time: item.time,
      location: item.location,
      organizer: item.organizer,
      organizerId: item.organizer_id,
      capacity: item.capacity,
      registered: item.registered,
      rsvpRequired: item.rsvp_required,
      tags: item.tags || [],
      status: item.status as any,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }
  }
}

// Singleton instance
let dbInstance: SupabaseDatabase | null = null

export function getSupabaseDatabase(): SupabaseDatabase {
  if (!dbInstance) {
    dbInstance = new SupabaseDatabase()
  }
  return dbInstance
}
