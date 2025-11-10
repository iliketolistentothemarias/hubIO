/**
 * Multi-Tenant Types
 */

export interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  customBranding?: {
    logo?: string
    favicon?: string
    colors?: {
      primary: string
      secondary: string
      background: string
      text: string
    }
  }
  settings: {
    maxResources: number
    maxEvents: number
    maxCampaigns: number
    maxUsers: number
    features: string[]
  }
  status: 'active' | 'suspended' | 'trial'
  createdAt: Date
  updatedAt: Date
}

export interface TenantUser {
  id: string
  tenantId: string
  userId: string
  role: 'admin' | 'member' | 'viewer'
  joinedAt: Date
}

