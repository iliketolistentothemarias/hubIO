/**
 * Make User Admin API
 * 
 * Makes a user an admin by email (for initial setup)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * POST /api/admin/make-admin
 * 
 * Make a user an admin by email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Find user by email
    const { data: users, error: findError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .limit(1)

    if (findError) {
      console.error('Error finding user:', findError)
      return NextResponse.json(
        { success: false, error: 'Failed to find user' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Update user role to admin
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      message: `User ${email} is now an admin`,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error making user admin:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to make user admin' },
      { status: 500 }
    )
  }
}

