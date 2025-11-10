/**
 * Session API Route
 * 
 * Gets the current user session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    // Get current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<{ user: any; session: any }> = {
      success: true,
      data: {
        user: userProfile,
        session,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Session error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

