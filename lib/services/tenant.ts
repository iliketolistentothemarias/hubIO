/**
 * Tenant Service
 * 
 * Handles multi-tenant architecture with white-label customization
 */

import { Tenant, TenantUser } from '@/lib/types/tenant'
import { getDatabase } from '@/lib/db/schema'

export class TenantService {
  private db = getDatabase()

  /**
   * Create Tenant
   */
  createTenant(tenant: Tenant): Tenant {
    this.db['tenants'] = this.db['tenants'] || new Map()
    this.db['tenants'].set(tenant.id, tenant)
    return tenant
  }

  /**
   * Get Tenant
   */
  getTenant(id: string): Tenant | undefined {
    if (!this.db['tenants']) return undefined
    return this.db['tenants'].get(id)
  }

  /**
   * Get Tenant by Slug
   */
  getTenantBySlug(slug: string): Tenant | undefined {
    if (!this.db['tenants']) return undefined
    for (const tenant of this.db['tenants'].values()) {
      if (tenant.slug === slug) {
        return tenant
      }
    }
    return undefined
  }

  /**
   * Get Tenant by Domain
   */
  getTenantByDomain(domain: string): Tenant | undefined {
    if (!this.db['tenants']) return undefined
    for (const tenant of this.db['tenants'].values()) {
      if (tenant.domain === domain) {
        return tenant
      }
    }
    return undefined
  }

  /**
   * Update Tenant
   */
  updateTenant(id: string, updates: Partial<Tenant>): Tenant | undefined {
    if (!this.db['tenants']) return undefined
    const tenant = this.db['tenants'].get(id)
    if (!tenant) return undefined

    const updated = { ...tenant, ...updates, updatedAt: new Date() }
    this.db['tenants'].set(id, updated)
    return updated
  }

  /**
   * Add User to Tenant
   */
  addTenantUser(tenantUser: TenantUser): TenantUser {
    this.db['tenantUsers'] = this.db['tenantUsers'] || new Map()
    this.db['tenantUsers'].set(tenantUser.id, tenantUser)
    return tenantUser
  }

  /**
   * Get Tenant Users
   */
  getTenantUsers(tenantId: string): TenantUser[] {
    if (!this.db['tenantUsers']) return []
    const users: TenantUser[] = []
    for (const user of this.db['tenantUsers'].values()) {
      if (user.tenantId === tenantId) {
        users.push(user)
      }
    }
    return users
  }

  /**
   * Get User Tenants
   */
  getUserTenants(userId: string): Tenant[] {
    if (!this.db['tenantUsers'] || !this.db['tenants']) return []
    
    const tenantIds = new Set<string>()
    for (const tenantUser of this.db['tenantUsers'].values()) {
      if (tenantUser.userId === userId) {
        tenantIds.add(tenantUser.tenantId)
      }
    }

    const tenants: Tenant[] = []
    for (const tenantId of tenantIds) {
      const tenant = this.db['tenants'].get(tenantId)
      if (tenant) tenants.push(tenant)
    }
    return tenants
  }

  /**
   * Check Resource Quota
   */
  checkResourceQuota(tenantId: string): { allowed: boolean; remaining: number } {
    const tenant = this.getTenant(tenantId)
    if (!tenant) {
      return { allowed: false, remaining: 0 }
    }

    const maxResources = tenant.settings.maxResources
    if (maxResources === -1) {
      return { allowed: true, remaining: -1 } // Unlimited
    }

    // Count current resources for tenant
    const resources = this.db.getAllResources()
    const tenantResources = resources.filter(r => r.submittedBy?.startsWith(tenantId)).length

    const remaining = Math.max(0, maxResources - tenantResources)
    return {
      allowed: remaining > 0,
      remaining,
    }
  }

  /**
   * Apply Tenant Branding
   */
  getTenantBranding(tenantId: string): Tenant['customBranding'] {
    const tenant = this.getTenant(tenantId)
    return tenant?.customBranding
  }
}

// Singleton instance
let tenantService: TenantService | null = null

export function getTenantService(): TenantService {
  if (!tenantService) {
    tenantService = new TenantService()
  }
  return tenantService
}

