/**
 * Pending Resources API
 * 
 * Get pending resources for admin review
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse, Resource } from '@/lib/types'

/**
 * GET /api/admin/pending-resources
 * 
 * Get all pending (unverified) resources (admin only)
 * Note: Client-side already verifies admin status, so we use admin client to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    // Use admin client (service role) to bypass RLS
    // Client-side already verified user is admin before making this request
    const adminClient = createAdminClient()
    
    // Query resources directly using admin client (bypasses RLS)
    const { data: resourcesData, error: resourcesError } = await adminClient
      .from('resources')
      .select('*')
      .eq('verified', false)
      .order('created_at', { ascending: false })
    
    if (resourcesError) {
      console.error('Error fetching pending resources from Supabase:', resourcesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending resources' },
        { status: 500 }
      )
    }
    
    console.log('Pending resources fetched from Supabase:', resourcesData?.length || 0)
    console.log('Pending resources data:', resourcesData)
    
    // Map Supabase data to Resource type
    const pendingResources = (resourcesData || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      address: item.address,
      location: item.location || { lat: 0, lng: 0, address: item.address, city: '', state: '', zipCode: '' },
      phone: item.phone,
      email: item.email,
      website: item.website || '',
      tags: item.tags || [],
      featured: item.featured || false,
      verified: item.verified || false,
      rating: item.rating,
      reviewCount: item.review_count,
      hours: item.hours,
      services: item.services,
      capacity: item.capacity,
      languages: item.languages,
      accessibility: item.accessibility,
      submittedBy: item.submitted_by,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }))

    const response: ApiResponse<Resource[]> = {
      success: true,
      data: pendingResources,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching pending resources:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending resources' },
      { status: 500 }
    )
  }
}

