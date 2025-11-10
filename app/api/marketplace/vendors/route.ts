/**
 * Marketplace Vendors API
 * 
 * Handles vendor registration and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Vendor } from '@/lib/types/marketplace'

const db = getDatabase()

/**
 * POST /api/marketplace/vendors
 * 
 * Register as a vendor
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { name, email, phone, description, logo, commissionRate } = body

    if (!name || !email || !phone || !description) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, and description are required' },
        { status: 400 }
      )
    }

    // Check if user is already a vendor
    const existingVendors = db.getAllVendors()
    const existingVendor = existingVendors.find(v => v.email === email || v.id === user.id)

    if (existingVendor) {
      return NextResponse.json(
        { success: false, error: 'You are already registered as a vendor' },
        { status: 400 }
      )
    }

    const vendor: Vendor = {
      id: `vendor_${user.id}`,
      name,
      email,
      phone,
      description,
      logo,
      verified: false, // Requires admin approval
      commissionRate: commissionRate || 0.15, // Default 15%
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    db.createVendor(vendor)

    // Update user role to vendor (would need to extend User type)
    // db.updateUser(user.id, { role: 'vendor' })

    const response: ApiResponse<Vendor> = {
      success: true,
      data: vendor,
      message: 'Vendor registration submitted. Awaiting approval.',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error registering vendor:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to register vendor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/marketplace/vendors
 * 
 * Get all vendors
 */
export async function GET(request: NextRequest) {
  try {
    const vendors = db.getAllVendors()

    const response: ApiResponse<Vendor[]> = {
      success: true,
      data: vendors,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

