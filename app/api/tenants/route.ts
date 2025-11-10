/**
 * Tenants API
 * 
 * Handle tenant/organization management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTenantService } from '@/lib/services/tenant'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Tenant } from '@/lib/types/tenant'

const tenantService = getTenantService()

/**
 * POST /api/tenants
 * 
 * Create a new tenant/organization
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { name, slug, domain, logo, primaryColor, secondaryColor } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug is available
    const existing = tenantService.getTenantBySlug(slug)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Slug already taken' },
        { status: 400 }
      )
    }

    const tenant: Tenant = {
      id: `tenant_${Date.now()}_${user.id}`,
      name,
      slug,
      domain,
      logo,
      primaryColor,
      secondaryColor,
      settings: {
        maxResources: 100,
        maxEvents: 50,
        maxCampaigns: 10,
        maxUsers: 10,
        features: ['resources', 'events', 'campaigns'],
      },
      status: 'trial',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    tenantService.createTenant(tenant)

    // Add creator as admin
    const { TenantUser } = await import('@/lib/types/tenant')
    const tenantUser: TenantUser = {
      id: `tu_${Date.now()}_${user.id}`,
      tenantId: tenant.id,
      userId: user.id,
      role: 'admin',
      joinedAt: new Date(),
    }
    tenantService.addTenantUser(tenantUser)

    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tenant:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tenants
 * 
 * Get user's tenants
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const tenants = tenantService.getUserTenants(user.id)

    const response: ApiResponse<typeof tenants> = {
      success: true,
      data: tenants,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching tenants:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

