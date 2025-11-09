/**
 * Fundraising Campaigns API Route
 * 
 * Handles CRUD operations for fundraising campaigns.
 * 
 * Endpoints:
 * - GET /api/campaigns - Get all campaigns
 * - POST /api/campaigns - Create new campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { validateCampaign } from '@/lib/utils/validation'
import { ApiResponse, FundraisingCampaign, PaginatedResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/campaigns
 * 
 * Get all campaigns with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    let campaigns = db.getAllCampaigns()

    // Filter by status
    if (status !== 'all') {
      campaigns = campaigns.filter(c => c.status === status)
    }

    // Filter by category
    if (category && category !== 'All') {
      campaigns = campaigns.filter(c => c.category === category)
    }

    // Sort by creation date (newest first)
    campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Pagination
    const total = campaigns.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedCampaigns = campaigns.slice(startIndex, startIndex + pageSize)

    const response: ApiResponse<PaginatedResponse<FundraisingCampaign>> = {
      success: true,
      data: {
        items: paginatedCampaigns,
        total,
        page,
        pageSize,
        totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns
 * 
 * Create a new fundraising campaign (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth()
    const body = await request.json()

    // Validate campaign data
    const validation = validateCampaign(body)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // Create campaign
    const campaign: FundraisingCampaign = {
      id: `campaign_${Date.now()}`,
      title: body.title,
      description: body.description,
      category: body.category,
      goal: body.goal,
      raised: 0,
      donors: 0,
      createdBy: user.id,
      organizationId: body.organizationId,
      startDate: new Date(),
      endDate: new Date(body.endDate),
      status: 'active',
      verified: false, // Requires admin verification
      updates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const created = db.createCampaign(campaign)

    const response: ApiResponse<FundraisingCampaign> = {
      success: true,
      data: created,
      message: 'Campaign created successfully. It will be reviewed by our team.',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

