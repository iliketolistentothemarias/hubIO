/**
 * Admin Volunteers API
 * 
 * Manage volunteer opportunities (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/admin/volunteers
 * 
 * Get all volunteer opportunities (admin only)
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

    // Try to use admin client if available
    let client = supabase
    try {
      const adminClient = createAdminClient()
      client = adminClient
    } catch (error) {
      console.warn('Admin client not available, using regular client')
    }

    // Get all volunteer opportunities
    const { data: volunteers, error: volunteersError } = await client
      .from('volunteer_opportunities')
      .select('*')
      .order('created_at', { ascending: false })

    if (volunteersError) {
      // Return empty array if table doesn't exist
      if (volunteersError.code === 'PGRST204' || volunteersError.message?.includes('relation') || volunteersError.message?.includes('schema cache')) {
        return NextResponse.json(
          { success: true, data: [] },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch volunteer opportunities' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      data: volunteers || [],
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching volunteer opportunities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volunteer opportunities' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/volunteers
 * 
 * Delete a volunteer opportunity (admin only)
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
    const volunteerId = searchParams.get('id')

    if (!volunteerId) {
      return NextResponse.json(
        { success: false, error: 'Volunteer opportunity ID is required' },
        { status: 400 }
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

    // Delete volunteer opportunity
    const { error: deleteError } = await client
      .from('volunteer_opportunities')
      .delete()
      .eq('id', volunteerId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete volunteer opportunity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Volunteer opportunity deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting volunteer opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete volunteer opportunity' },
      { status: 500 }
    )
  }
}

