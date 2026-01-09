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
    const tenants = this.db.getCollection('tenants')
    tenants.set(tenant.id, tenant)
    this.db.save()
    return tenant
  }

  /**
   * Get Tenant
   */
  getTenant(id: string): Tenant | undefined {
    const tenants = this.db.getCollection('tenants')
    return tenants.get(id) as any
  }

  /**
   * Get Tenant by Slug
   */
  getTenantBySlug(slug: string): Tenant | undefined {
    const tenants = this.db.getCollection('tenants')
    for (const tenant of tenants.values()) {
      const t = tenant as any
      if (t.slug === slug) {
        return t
      }
    }
    return undefined
  }

  /**
   * Get Tenant by Domain
   */
  getTenantByDomain(domain: string): Tenant | undefined {
    const tenants = this.db.getCollection('tenants')
    for (const tenant of tenants.values()) {
      const t = tenant as any
      if (t.domain === domain) {
        return t
      }
    }
    return undefined
  }

  /**
   * Update Tenant
   */
  updateTenant(id: string, updates: Partial<Tenant>): Tenant | undefined {
    const tenants = this.db.getCollection('tenants')
    const tenant = tenants.get(id) as any
    if (!tenant) return undefined

    const updated = { ...tenant, ...updates, updatedAt: new Date() }
    tenants.set(id, updated)
    this.db.save()
    return updated
  }

  /**
   * Add User to Tenant
   */
  addTenantUser(tenantUser: TenantUser): TenantUser {
    const tenantUsers = this.db.getCollection('tenantUsers')
    tenantUsers.set(tenantUser.id, tenantUser)
    this.db.save()
    return tenantUser
  }

  /**
   * Get Tenant Users
   */
  getTenantUsers(tenantId: string): TenantUser[] {
    const tenantUsers = this.db.getCollection('tenantUsers')
    const users: TenantUser[] = []
    for (const user of tenantUsers.values()) {
      const tu = user as any
      if (tu.tenantId === tenantId) {
        users.push(tu)
      }
    }
    return users
  }

  /**
   * Get User Tenants
   */
  getUserTenants(userId: string): Tenant[] {
    const tenantUsers = this.db.getCollection('tenantUsers')
    const tenants = this.db.getCollection('tenants')
    
    const tenantIds = new Set<string>()
    for (const tenantUser of tenantUsers.values()) {
      const tu = tenantUser as any
      if (tu.userId === userId) {
        tenantIds.add(tu.tenantId)
      }
    }

    const result: Tenant[] = []
    for (const tenantId of tenantIds) {
      const tenant = tenants.get(tenantId) as any
      if (tenant) result.push(tenant)
    }
    return result
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

