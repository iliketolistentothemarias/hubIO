import { supabase } from './client'
import { Resource, Event, FundraisingCampaign, VolunteerOpportunity, Post, Comment, EventRegistration } from '@/lib/types'

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

  // ============================================================================
  // EVENT REGISTRATIONS
  // ============================================================================
  
  async createEventRegistration(registration: Omit<EventRegistration, 'id'>): Promise<EventRegistration> {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: registration.eventId,
        user_id: registration.userId,
        status: registration.status,
        registered_at: registration.registeredAt.toISOString(),
      })
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
  // VOLUNTEER OPPORTUNITIES
  // ============================================================================
  
  async getAllVolunteerOpportunities(): Promise<VolunteerOpportunity[]> {
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      // Suppress "table not found" errors - table may not exist yet
      if (error.code !== 'PGRST205') {
        console.error('Error fetching volunteer opportunities:', error)
      }
      return []
    }
    
    return this.mapVolunteerOpportunitiesFromSupabase(data || [])
  }

  async createVolunteerOpportunity(opportunity: Omit<VolunteerOpportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<VolunteerOpportunity> {
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .insert({
        title: opportunity.title,
        description: opportunity.description,
        organization: opportunity.organization,
        organization_id: opportunity.organizationId,
        category: opportunity.category,
        location: opportunity.location,
        skills_required: opportunity.skills || [],
        time_commitment: opportunity.duration || '',
        age_requirement: '',
        status: 'active',
      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.mapVolunteerOpportunityFromSupabase(data)
  }

  async updateVolunteerOpportunity(id: string, updates: Partial<VolunteerOpportunity>): Promise<VolunteerOpportunity | null> {
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.organization !== undefined) updateData.organization = updates.organization
    if (updates.organizationId !== undefined) updateData.organization_id = updates.organizationId
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.skills !== undefined) updateData.skills_required = updates.skills
    if (updates.duration !== undefined) updateData.time_commitment = updates.duration
    if (updates.status !== undefined) updateData.status = updates.status
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error || !data) return null
    
    return this.mapVolunteerOpportunityFromSupabase(data)
  }

  async deleteVolunteerOpportunity(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('volunteer_opportunities')
      .delete()
      .eq('id', id)
    
    return !error
  }

  // ============================================================================
  // POSTS
  // ============================================================================
  
  async getAllPosts(category?: string): Promise<Post[]> {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('status', 'active')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      // Suppress "table not found" errors - table may not exist yet
      if (error.code !== 'PGRST205') {
        console.error('Error fetching posts:', error)
      }
      return []
    }
    
    // Fetch comments separately for each post
    const postsWithComments = await Promise.all(
      (data || []).map(async (post: any) => {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })
        
        return {
          ...post,
          comments: commentsData || [],
        }
      })
    )
    
    return this.mapPostsFromSupabase(postsWithComments)
  }

  async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    
    // Fetch comments separately
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    
    return this.mapPostFromSupabase({
      ...data,
      comments: commentsData || [],
    })
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author: post.author,
        author_id: post.authorId,
        title: post.title,
        content: post.content,
        category: post.category,
        likes: post.likes || 0,
        tags: post.tags || [],
        pinned: post.pinned || false,
        status: post.status || 'active',
      })
      .select('*')
      .single()
    
    if (error) throw error
    
    return this.mapPostFromSupabase({
      ...data,
      comments: [],
    })
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.pinned !== undefined) updateData.pinned = updates.pinned
    if (updates.status !== undefined) updateData.status = updates.status
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error || !data) return null
    
    // Fetch comments separately
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    
    return this.mapPostFromSupabase({
      ...data,
      comments: commentsData || [],
    })
  }

  async deletePost(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
    
    return !error
  }

  async togglePostLike(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()
    
    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Get updated likes count
      const { data: post } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single()
      
      return { liked: false, likes: post?.likes || 0 }
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
        })
      
      if (error) throw error
      
      // Get updated likes count
      const { data: post } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single()
      
      return { liked: true, likes: post?.likes || 0 }
    }
  }

  async checkPostLiked(postId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()
    
    return !!data
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================
  
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }
    
    return this.mapCommentsFromSupabase(data || [])
  }

  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: comment.postId,
        author: comment.author,
        author_id: comment.authorId,
        content: comment.content,
        likes: comment.likes || 0,
        parent_id: comment.parentId || null,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.mapCommentFromSupabase(data)
  }

  async deleteComment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    
    return !error
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

  private mapVolunteerOpportunitiesFromSupabase(data: any[]): VolunteerOpportunity[] {
    return data.map(item => this.mapVolunteerOpportunityFromSupabase(item))
  }

  private mapVolunteerOpportunityFromSupabase(item: any): VolunteerOpportunity {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      organization: item.organization,
      organizationId: item.organization_id,
      category: item.category,
      date: new Date(),
      time: '',
      location: item.location || { lat: 40.4406, lng: -79.9961, address: '', city: '', state: 'PA', zipCode: '' },
      volunteersNeeded: 0,
      volunteersSignedUp: 0,
      skills: item.skills_required || [],
      requirements: [],
      remote: false,
      duration: item.time_commitment || '',
      status: item.status as any,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }
  }

  private mapPostsFromSupabase(data: any[]): Post[] {
    return data.map(item => this.mapPostFromSupabase(item))
  }

  private mapPostFromSupabase(item: any): Post {
    const comments = item.comments ? this.mapCommentsFromSupabase(item.comments) : []
    
    return {
      id: item.id,
      author: item.author,
      authorId: item.author_id,
      title: item.title,
      content: item.content,
      category: item.category as any,
      likes: item.likes || 0,
      comments: comments,
      tags: item.tags || [],
      pinned: item.pinned || false,
      status: item.status as any,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }
  }

  private mapCommentsFromSupabase(data: any[]): Comment[] {
    return data.map(item => this.mapCommentFromSupabase(item))
  }

  private mapCommentFromSupabase(item: any): Comment {
    return {
      id: item.id,
      postId: item.post_id,
      author: item.author,
      authorId: item.author_id,
      content: item.content,
      likes: item.likes || 0,
      parentId: item.parent_id,
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

