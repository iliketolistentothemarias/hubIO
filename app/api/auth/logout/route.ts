/**
 * Logout API Route
 * 
 * Handles user logout and session termination.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Logged out successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

