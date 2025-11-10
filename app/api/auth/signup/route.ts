/**
 * Sign Up API Route
 * 
 * Handles user registration with email and password.
 * Creates user in Supabase Auth and stores user profile in database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

// Cooldown store: email -> last signup timestamp
const signupCooldown = new Map<string, number>()
const COOLDOWN_SECONDS = 10

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [email, timestamp] of signupCooldown.entries()) {
    if (now - timestamp > COOLDOWN_SECONDS * 1000) {
      signupCooldown.delete(email)
    }
  }
}, 5 * 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check cooldown
    const normalizedEmail = email.toLowerCase().trim()
    const lastSignup = signupCooldown.get(normalizedEmail)
    if (lastSignup) {
      const timeSinceLastSignup = (Date.now() - lastSignup) / 1000
      if (timeSinceLastSignup < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - timeSinceLastSignup)
        return NextResponse.json(
          { success: false, error: `Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before signing up again.` },
          { status: 429 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Try to use admin client, fall back to regular client if service role key is not set
    let adminClient = null
    let useAdminClient = false
    
    try {
      adminClient = createAdminClient()
      useAdminClient = true
    } catch (adminError: any) {
      console.warn('Admin client not available, using regular signup flow:', adminError.message)
      // Will use regular client below
    }

    let authData: any = null
    let authError: any = null

    if (useAdminClient && adminClient) {
      // Create user in Supabase Auth using admin client
      // This allows us to auto-confirm the email
      const result = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
        },
      })
      authData = result.data
      authError = result.error
    } else {
      // Use regular signup flow
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyiqvodabfsovjjgjdxs.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXF2b2RhYmZzb3ZqamdqZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUxMzksImV4cCI6MjA3ODIxMTEzOX0.YQ7tT-q1dk_krROobItrn7sxVmIxut7VGNR7WaonFEg'
      const regularClient = createClient(supabaseUrl, supabaseAnonKey)
      
      const result = await regularClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })
      authData = result.data
      authError = result.error
    }

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: authError.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    if (!authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user profile in database
    // Try with admin client first, then fall back to regular client
    let dbError: any = null
    let existingUser: any = null

    if (useAdminClient && adminClient) {
      // Create user profile in database using admin client to bypass RLS
      const { error, data } = await adminClient
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email!,
          name,
          role: 'resident',
          karma: 0,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
      
      dbError = error

      if (dbError) {
        // Check if user already exists (from trigger)
        const { data: userData } = await adminClient
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        existingUser = userData
      }
    } else {
      // With regular client, the trigger should create the user profile automatically
      // Wait a bit for the trigger to execute, then check if user exists
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyiqvodabfsovjjgjdxs.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXF2b2RhYmZzb3ZqamdqZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUxMzksImV4cCI6MjA3ODIxMTEzOX0.YQ7tT-q1dk_krROobItrn7sxVmIxut7VGNR7WaonFEg'
      const regularClient = createClient(supabaseUrl, supabaseAnonKey)
      
      // Check if user profile was created by trigger
      const { data: userData, error: checkError } = await regularClient
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      existingUser = userData
      if (!existingUser && checkError) {
        dbError = checkError
      }
    }

    if (dbError && !existingUser) {
      console.error('Failed to create user profile:', {
        error: dbError,
        userId: authData.user.id,
        email: authData.user.email,
        useAdminClient,
        errorMessage: dbError?.message,
        errorCode: dbError?.code,
        errorDetails: dbError,
      })
      
      // Check if the error is due to missing table
      const isTableMissing = dbError?.message?.includes('schema cache') || 
                            dbError?.message?.includes('relation') ||
                            dbError?.code === 'PGRST204' ||
                            dbError?.code === '42P01'
      
      // Clean up auth user if profile creation failed (but not if table is missing - user can still sign in)
      if (useAdminClient && adminClient && !isTableMissing) {
        try {
          await adminClient.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('Failed to clean up auth user:', deleteError)
        }
      }
      
      // If table is missing, provide helpful error message
      if (isTableMissing) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database table not found. Please run the migration script to create the users table. See lib/db/migrations/create_users_table.sql',
            errorCode: 'TABLE_NOT_FOUND',
            details: 'The users table does not exist in your Supabase database. Please run the SQL migration in the Supabase SQL Editor.'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create user profile: ${dbError?.message || 'Unknown error'}. Please try again.` 
        },
        { status: 500 }
      )
    }

    // Log success for debugging
    if (existingUser) {
      console.log('User profile created successfully:', {
        userId: authData.user.id,
        email: authData.user.email,
        createdBy: useAdminClient ? 'admin client' : 'trigger',
      })
    }

    // Update cooldown
    signupCooldown.set(normalizedEmail, Date.now())

    // Get session - if we used regular signup, session is already in authData
    let session = authData?.session || null
    
    // If no session (admin client or email confirmation required), try to sign in
    if (!session) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyiqvodabfsovjjgjdxs.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXF2b2RhYmZzb3ZqamdqZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUxMzksImV4cCI6MjA3ODIxMTEzOX0.YQ7tT-q1dk_krROobItrn7sxVmIxut7VGNR7WaonFEg'
        const regularClient = createClient(supabaseUrl, supabaseAnonKey)
        
        const { data: signInData, error: signInError } = await regularClient.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          console.error('Session creation error:', signInError)
        } else {
          session = signInData.session
        }
      } catch (sessionErr) {
        console.error('Error creating session:', sessionErr)
        // Session creation failed, but user is created - they can sign in manually
      }
    }

    const response: ApiResponse<{ user: any; session: any }> = {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name,
          role: 'resident',
        },
        session: session,
      },
      message: 'Account created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

