/**
 * Smart Matching Engine
 * 
 * ML-based matching algorithm to connect users with resources,
 * opportunities, and other users based on preferences, behavior, and needs
 */

import { User, Resource, VolunteerOpportunity, Event, FundraisingCampaign } from '@/lib/types'

export interface Match {
  id: string
  type: 'resource' | 'volunteer' | 'event' | 'campaign' | 'user'
  item: Resource | VolunteerOpportunity | Event | FundraisingCampaign | User
  score: number
  reasons: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface MatchingCriteria {
  location?: { lat: number; lng: number; radius?: number }
  categories?: string[]
  skills?: string[]
  interests?: string[]
  availability?: string[]
  budget?: { min?: number; max?: number }
  timeCommitment?: string
  preferences?: Record<string, any>
}

/**
 * Calculate match score between user and resource
 */
export function calculateResourceMatch(
  user: User,
  resource: Resource,
  criteria?: MatchingCriteria
): number {
  let score = 0
  const maxScore = 100

  // Location proximity (30 points)
  if (user.location && resource.location) {
    const distance = calculateDistance(
      user.location.lat,
      user.location.lng,
      resource.location.lat,
      resource.location.lng
    )
    const maxDistance = criteria?.location?.radius || 50 // km
    const proximityScore = Math.max(0, 30 * (1 - distance / maxDistance))
    score += proximityScore
  }

  // Category match (25 points)
  if (criteria?.categories?.includes(resource.category)) {
    score += 25
  } else if (user.preferences && resource.category) {
    // Check if category aligns with user's past behavior
    score += 15
  }

  // Tags/Interests match (20 points)
  if (criteria?.interests) {
    const matchingTags = resource.tags.filter(tag =>
      criteria.interests!.some(interest =>
        tag.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(tag.toLowerCase())
      )
    )
    score += (matchingTags.length / Math.max(resource.tags.length, 1)) * 20
  }

  // Rating/Quality (15 points)
  if (resource.rating) {
    score += (resource.rating / 5) * 15
  } else {
    score += 7.5 // Neutral score for unrated resources
  }

  // Verified status (10 points)
  if (resource.verified) {
    score += 10
  }

  return Math.min(score, maxScore)
}

/**
 * Calculate match score for volunteer opportunities
 */
export function calculateVolunteerMatch(
  user: User,
  opportunity: VolunteerOpportunity,
  criteria?: MatchingCriteria
): number {
  let score = 0
  const maxScore = 100

  // Location (25 points)
  if (user.location && opportunity.location) {
    const distance = calculateDistance(
      user.location.lat,
      user.location.lng,
      opportunity.location.lat,
      opportunity.location.lng
    )
    const maxDistance = criteria?.location?.radius || 50
    score += Math.max(0, 25 * (1 - distance / maxDistance))
  }

  // Skills match (30 points)
  if (opportunity.skills && opportunity.skills.length > 0) {
    // In a real system, we'd check user's skills from their profile
    const skillMatch = 0.6 // Placeholder
    score += skillMatch * 30
  }

  // Category match (20 points)
  if (criteria?.categories?.includes(opportunity.category)) {
    score += 20
  }

  // Remote option (15 points)
  if (opportunity.remote && criteria?.preferences?.preferRemote) {
    score += 15
  }

  // Time commitment (10 points)
  if (criteria?.timeCommitment && opportunity.duration) {
    if (criteria.timeCommitment === opportunity.duration) {
      score += 10
    }
  }

  return Math.min(score, maxScore)
}

/**
 * Calculate match score for events
 */
export function calculateEventMatch(
  user: User,
  event: Event,
  criteria?: MatchingCriteria
): number {
  let score = 0
  const maxScore = 100

  // Location (30 points)
  if (user.location && event.location) {
    const distance = calculateDistance(
      user.location.lat,
      user.location.lng,
      event.location.lat,
      event.location.lng
    )
    const maxDistance = criteria?.location?.radius || 50
    score += Math.max(0, 30 * (1 - distance / maxDistance))
  }

  // Category/Tags match (25 points)
  if (criteria?.categories) {
    const categoryMatch = criteria.categories.includes(event.category)
    const tagMatch = event.tags.some(tag =>
      criteria.categories!.some(cat =>
        tag.toLowerCase().includes(cat.toLowerCase())
      )
    )
    if (categoryMatch || tagMatch) {
      score += 25
    }
  }

  // Date/Availability (20 points)
  const eventDate = new Date(event.date)
  const now = new Date()
  if (eventDate > now) {
    const daysUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysUntil <= 30) {
      score += 20
    } else if (daysUntil <= 60) {
      score += 15
    } else {
      score += 10
    }
  }

  // Capacity (15 points)
  if (event.capacity && event.registered) {
    const availability = (event.capacity - event.registered) / event.capacity
    score += availability * 15
  }

  // Price (10 points)
  if (event.ticketPrice === 0 || !event.ticketPrice) {
    score += 10
  } else if (criteria?.budget && event.ticketPrice <= (criteria.budget.max || Infinity)) {
    score += 10
  }

  return Math.min(score, maxScore)
}

/**
 * Get personalized matches for a user
 */
export function getPersonalizedMatches(
  user: User,
  items: {
    resources?: Resource[]
    volunteerOpportunities?: VolunteerOpportunity[]
    events?: Event[]
    campaigns?: FundraisingCampaign[]
  },
  criteria?: MatchingCriteria,
  limit: number = 10
): Match[] {
  const matches: Match[] = []

  // Match resources
  if (items.resources) {
    items.resources.forEach(resource => {
      const score = calculateResourceMatch(user, resource, criteria)
      if (score > 30) { // Minimum threshold
        matches.push({
          id: `resource_${resource.id}`,
          type: 'resource',
          item: resource,
          score,
          reasons: generateMatchReasons('resource', resource, score, criteria),
          confidence: score > 70 ? 'high' : score > 50 ? 'medium' : 'low',
        })
      }
    })
  }

  // Match volunteer opportunities
  if (items.volunteerOpportunities) {
    items.volunteerOpportunities.forEach(opportunity => {
      const score = calculateVolunteerMatch(user, opportunity, criteria)
      if (score > 30) {
        matches.push({
          id: `volunteer_${opportunity.id}`,
          type: 'volunteer',
          item: opportunity,
          score,
          reasons: generateMatchReasons('volunteer', opportunity, score, criteria),
          confidence: score > 70 ? 'high' : score > 50 ? 'medium' : 'low',
        })
      }
    })
  }

  // Match events
  if (items.events) {
    items.events.forEach(event => {
      const score = calculateEventMatch(user, event, criteria)
      if (score > 30) {
        matches.push({
          id: `event_${event.id}`,
          type: 'event',
          item: event,
          score,
          reasons: generateMatchReasons('event', event, score, criteria),
          confidence: score > 70 ? 'high' : score > 50 ? 'medium' : 'low',
        })
      }
    })
  }

  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Generate human-readable reasons for a match
 */
function generateMatchReasons(
  type: string,
  item: any,
  score: number,
  criteria?: MatchingCriteria
): string[] {
  const reasons: string[] = []

  if (score > 70) {
    reasons.push('Excellent match based on your preferences')
  } else if (score > 50) {
    reasons.push('Good match for your interests')
  }

  if (type === 'resource') {
    if (item.verified) {
      reasons.push('Verified organization')
    }
    if (item.rating && item.rating >= 4) {
      reasons.push('Highly rated by community')
    }
    if (criteria?.categories?.includes(item.category)) {
      reasons.push(`Matches your interest in ${item.category}`)
    }
  } else if (type === 'volunteer') {
    if (item.remote) {
      reasons.push('Remote opportunity available')
    }
    if (item.volunteersNeeded > item.volunteersSignedUp) {
      reasons.push('Urgent need for volunteers')
    }
  } else if (type === 'event') {
    const daysUntil = (new Date(item.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntil <= 7) {
      reasons.push('Happening soon')
    }
    if (!item.ticketPrice || item.ticketPrice === 0) {
      reasons.push('Free event')
    }
  }

  return reasons
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

