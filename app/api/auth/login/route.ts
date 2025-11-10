/**
 * Login API Route
 * 
 * Handles user authentication with email and password.
 * Returns session token and user data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create server client
    const supabase = createServerClient(request)

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      // If profile doesn't exist, create it
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
          role: 'resident',
          karma: 0,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })

      if (createError) {
        return NextResponse.json(
          { success: false, error: 'Failed to load user profile' },
          { status: 500 }
        )
      }

      // Fetch the newly created profile
      const { data: newProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Update last_active_at
      await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', authData.user.id)

      const response: ApiResponse<{ user: any; session: any }> = {
        success: true,
        data: {
          user: newProfile || {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
            role: 'resident',
            karma: 0,
          },
          session: authData.session,
        },
      }

      return NextResponse.json(response)
    }

    // Update last_active_at
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', authData.user.id)

    const response: ApiResponse<{ user: any; session: any }> = {
      success: true,
      data: {
        user: userProfile,
        session: authData.session,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

