/**
 * Social Network Types
 * 
 * Types for social features like following, groups, and activity feeds
 */

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export interface Group {
  id: string
  name: string
  description: string
  image?: string
  creatorId: string
  members: string[]
  memberCount: number
  category: string
  tags: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: ActivityType
  action: string
  targetId?: string
  targetName?: string
  targetType?: 'resource' | 'event' | 'volunteer' | 'campaign' | 'post' | 'user'
  metadata?: Record<string, any>
  createdAt: Date
}

export type ActivityType =
  | 'resource_saved'
  | 'resource_rated'
  | 'event_rsvp'
  | 'volunteer_applied'
  | 'donation_made'
  | 'post_created'
  | 'post_liked'
  | 'comment_added'
  | 'user_followed'
  | 'group_joined'
  | 'badge_earned'
  | 'achievement_unlocked'

export interface UserProfile {
  id: string
  name: string
  avatar?: string
  bio?: string
  location?: string
  followers: number
  following: number
  karma: number
  badges: string[]
  isFollowing?: boolean
  mutualConnections?: number
}

