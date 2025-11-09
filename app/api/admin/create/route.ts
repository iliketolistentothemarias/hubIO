/**
 * Create Admin Account API
 * 
 * Creates a default admin account.
 * Only works in development mode.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { getAuthService } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

/**
 * POST /api/admin/create
 * 
 * Create admin account (development only)
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    const db = getDatabase()
    const auth = getAuthService()

    const adminEmail = 'admin@hubio.org'
    const adminPassword = 'admin123'
    const adminName = 'Admin User'

    // Check if admin already exists
    const allUsers = Array.from((db as any).db.users.values())
    const existingUser = allUsers.find((u: any) => u.email === adminEmail)
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Admin account already exists',
        data: {
          email: adminEmail,
          password: adminPassword,
        },
      })
    }

    // Create admin user directly with admin role
    const userId = `user_${Date.now()}`
    const user: any = {
      id: userId,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
          events: true,
          volunteer: true,
          fundraising: true,
        },
        accessibility: {
          highContrast: false,
          textToSpeech: false,
          dyslexiaFriendly: false,
          fontSize: 'medium',
        },
      },
      karma: 0,
      badges: [],
      createdAt: new Date(),
      lastActiveAt: new Date(),
    }
    
    // Save user to database
    db.createUser(user)
    
    // Store auth credentials for login (demo only - production would use bcrypt)
    // The auth service will handle this when user signs in

    const response: ApiResponse<any> = {
      success: true,
      message: 'Admin account created successfully',
      data: {
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error creating admin account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create admin account' },
      { status: 500 }
    )
  }
}

