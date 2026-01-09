/**
 * Core Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the application. Centralized for consistency and easy maintenance.
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  location?: Location
  preferences: UserPreferences
  karma: number
  resources_count: number
  funds_raised: number
  events_count: number
  badges: Badge[]
  createdAt: Date
  lastActiveAt: Date
}

export type UserRole = 'volunteer' | 'organizer' | 'admin'
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: NotificationSettings
  accessibility: AccessibilitySettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  events: boolean
  volunteer: boolean
  fundraising: boolean
}

export interface AccessibilitySettings {
  highContrast: boolean
  textToSpeech: boolean
  dyslexiaFriendly: boolean
  fontSize: 'small' | 'medium' | 'large'
}

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export interface Resource {
  id: string
  name: string
  category: ResourceCategory
  description: string
  address: string
  location: Location
  phone: string
  email: string
  website: string
  tags: string[]
  featured: boolean
  image?: string
  coordinates?: { lat: number; lng: number } // Optional for backward compatibility
  rating?: number
  reviewCount?: number
  hours?: string
  services?: string[]
  capacity?: number
  languages?: string[]
  accessibility?: string[]
  events?: Event[]
  verified: boolean
  submittedBy?: string
  createdAt: Date
  updatedAt: Date
}

export type ResourceCategory =
  | 'Food Assistance'
  | 'Housing'
  | 'Health Services'
  | 'Youth Services'
  | 'Senior Services'
  | 'Education'
  | 'Employment'
  | 'Legal Services'
  | 'Support Services'
  | 'Community Programs'
  | 'Family Services'

export interface Location {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  zipCode: string
}

// ============================================================================
// VOLUNTEER & EMPLOYMENT TYPES
// ============================================================================

export interface VolunteerOpportunity {
  id: string
  title: string
  organization: string
  organizationId: string
  description: string
  category: string
  date: Date
  time: string
  location: Location
  volunteersNeeded: number
  volunteersSignedUp: number
  skills?: string[]
  requirements?: string[]
  remote: boolean
  duration: string
  status: 'active' | 'filled' | 'cancelled' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface EmploymentOpportunity {
  id: string
  title: string
  organization: string
  organizationId: string
  description: string
  category: string
  location: Location
  remote: boolean
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  salary?: string
  requirements: string[]
  skills: string[]
  applicationUrl?: string
  status: 'active' | 'filled' | 'closed'
  createdAt: Date
  updatedAt: Date
}

export interface VolunteerApplication {
  id: string
  opportunityId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  hoursCompleted?: number
  appliedAt: Date
  reviewedAt?: Date
}

// ============================================================================
// FUNDRAISING TYPES
// ============================================================================

export interface FundraisingCampaign {
  id: string
  title: string
  description: string
  category: string
  goal: number
  raised: number
  donors: number
  organizer?: string
  organizerId?: string
  organizationId?: string
  createdBy?: string
  location?: Location
  startDate?: Date
  endDate?: Date
  deadline?: Date
  status: 'active' | 'completed' | 'cancelled' | 'pending' | 'failed'
  verified?: boolean
  image?: string
  tags?: string[]
  updates?: CampaignUpdate[]
  createdAt: Date
  updatedAt?: Date
}

export interface CampaignUpdate {
  id: string
  campaignId: string
  title: string
  content: string
  image?: string
  createdAt: Date
}

export interface Donation {
  id: string
  campaignId: string
  userId: string
  amount: number
  anonymous: boolean
  message?: string
  paymentMethod: 'stripe' | 'paypal'
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface Event {
  id: string
  name: string
  description: string
  category: string
  date: Date
  time: string
  location: Location
  organizer: string
  organizerId: string
  image?: string
  capacity?: number
  registered: number
  rsvpRequired: boolean
  ticketPrice?: number
  tags: string[]
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface EventRegistration {
  id: string
  eventId: string
  userId: string
  status: 'registered' | 'attended' | 'cancelled' | 'waitlist'
  registeredAt: Date
  checkedInAt?: Date
  reminderSent?: boolean
  calendarAdded?: boolean
}

// ============================================================================
// ACHIEVEMENT & GAMIFICATION TYPES
// ============================================================================

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earnedAt: Date
}

export type BadgeCategory = 'volunteer' | 'donor' | 'contributor' | 'community' | 'special'

export interface Achievement {
  id: string
  userId: string
  badgeId: string
  progress: number
  completed: boolean
  completedAt?: Date
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface CommunityStats {
  totalResources: number
  totalVolunteers: number
  totalDonations: number
  totalEvents: number
  activeUsers: number
  impactMetrics: ImpactMetrics
  trends: TrendData[]
}

export interface ImpactMetrics {
  livesImpacted: number
  fundsRaised: number
  resourcesShared: number
  eventsHosted: number
}

export interface TrendData {
  date: Date
  value: number
  category: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string | undefined>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// FORM & VALIDATION TYPES
// ============================================================================

export interface FormErrors {
  [key: string]: string | undefined
}

export interface ValidationResult {
  valid: boolean
  errors: FormErrors
}

