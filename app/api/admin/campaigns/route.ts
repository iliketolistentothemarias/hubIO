/**
 * Admin Campaigns API
 * 
 * Manage fundraising campaigns (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/admin/campaigns
 * 
 * Get all campaigns (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (campaignsError) {
      // Return empty array if table doesn't exist
      if (campaignsError.code === 'PGRST204' || campaignsError.message?.includes('relation') || campaignsError.message?.includes('schema cache')) {
        return NextResponse.json(
          { success: true, data: [] },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      data: campaigns || [],
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/campaigns
 * 
 * Delete a campaign (admin only)
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Delete campaign
    const { error: deleteError } = await supabase
      .from('fundraising_campaigns')
      .delete()
      .eq('id', campaignId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

