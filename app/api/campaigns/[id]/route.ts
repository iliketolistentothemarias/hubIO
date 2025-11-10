/**
 * Individual Campaign API Route
 * 
 * Handles operations for a specific campaign.
 * 
 * Endpoints:
 * - GET /api/campaigns/[id] - Get campaign by ID
 * - PATCH /api/campaigns/[id] - Update campaign
 * - DELETE /api/campaigns/[id] - Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { ApiResponse, FundraisingCampaign } from '@/lib/types'

/**
 * GET /api/campaigns/[id]
 * 
 * Get campaign by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getSupabaseDatabase()
    const campaign = await db.getCampaignById(params.id)

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<FundraisingCampaign> = {
      success: true,
      data: campaign,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaigns/[id]
 * 
 * Update campaign (requires authentication and ownership or admin role)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(request)
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    // Try to use admin client if available
    let client = supabase
    try {
      const adminClient = createAdminClient()
      client = adminClient
    } catch (error) {
      console.warn('Admin client not available, using regular client')
    }

    // Get the campaign
    const db = getSupabaseDatabase()
    const campaign = await db.getCampaignById(params.id)

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check permissions (owner or admin)
    if (campaign.organizerId !== session.user.id && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Update campaign in Supabase
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.goal !== undefined) updateData.goal = body.goal
    if (body.raised !== undefined) updateData.raised = body.raised
    if (body.donors !== undefined) updateData.donors = body.donors
    if (body.status !== undefined) updateData.status = body.status
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline).toISOString().split('T')[0] : null
    if (body.tags !== undefined) updateData.tags = body.tags
    updateData.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await client
      .from('fundraising_campaigns')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .maybeSingle()

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update campaign' },
        { status: 500 }
      )
    }

    // Map to FundraisingCampaign type
    const updatedCampaign: FundraisingCampaign = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      goal: parseFloat(updated.goal) || 0,
      raised: parseFloat(updated.raised) || 0,
      donors: updated.donors || 0,
      organizer: updated.organizer,
      organizerId: updated.organizer_id,
      location: updated.location,
      deadline: updated.deadline ? new Date(updated.deadline) : undefined,
      status: updated.status as any,
      tags: updated.tags || [],
      createdAt: new Date(updated.created_at),
      updatedAt: updated.updated_at ? new Date(updated.updated_at) : undefined,
    }

    const response: ApiResponse<FundraisingCampaign> = {
      success: true,
      data: updatedCampaign,
      message: 'Campaign updated successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]
 * 
 * Delete campaign (requires admin role)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(request)
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Try to use admin client if available
    let client = supabase
    try {
      const adminClient = createAdminClient()
      client = adminClient
    } catch (error) {
      console.warn('Admin client not available, using regular client')
    }

    // Delete campaign
    const { error: deleteError } = await client
      .from('fundraising_campaigns')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete campaign' },
        { status: 500 }
      )
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Campaign deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

