/**
 * Authentication Service
 * 
 * Handles user authentication, authorization, and session management.
 * Integrates with Supabase Auth for authentication.
 */

import { User, UserRole, Badge } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
/**
 * Authentication Provider Types
 */
export type AuthProvider = 'google' | 'email' | 'school'
/**
 * Session Data
 */
export interface Session {
  user: User
  token: string
  expiresAt: Date
  provider: AuthProvider
}

/**
 * Authentication Service Class
 * 
 * Provides methods for authentication, authorization, and session management
 */
export class AuthService {
  private currentSession: Session | null = null

  /**
   * Sign In with OAuth Provider
   * 
   * @param provider - OAuth provider (Google, Microsoft, GitHub)
   * @returns Promise<Session>
   */
  async signInWithOAuth(provider: AuthProvider): Promise<Session> {
    // In production, this would redirect to OAuth provider
    // For demo purposes, we'll simulate the flow
    
    if (typeof window === 'undefined') {
      throw new Error('OAuth sign-in must be called from client-side')
    }

    // Simulate OAuth flow
    const mockUser: User = {
      id: `user_${Date.now()}`,
      email: `user@${provider}.com`,
      name: `User from ${provider}`,
      role: 'volunteer',
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

    const session: Session = {
      user: mockUser,
      token: this.generateToken(mockUser),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      provider,
    }

    this.currentSession = session
    this.saveSession(session)
    
    return session
  }

  /**
   * Sign In with Email and Password
   * 
   * @param email - User email
   * @param password - User password
   * @returns Promise<Session>
   */
  async signInWithEmail(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session || !data.user) throw new Error('Failed to sign in')

    const session = await this.getSession()
    if (!session) throw new Error('Failed to get session after sign in')
    
    return session
  }

  /**
   * Sign Up New User
   * 
   * @param email - User email
   * @param password - User password
   * @param name - User name
   * @param role - User role (optional, defaults to volunteer)
   * @returns Promise<Session>
   */
  async signUp(email: string, password: string, name: string, role: string = 'volunteer'): Promise<Session> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    })

    if (error) throw error
    if (!data.user) throw new Error('Failed to sign up')

    // If session is returned directly (auto-login enabled in Supabase)
    if (data.session) {
      const session = await this.getSession()
      if (session) return session
    }

    // Return a dummy session or handle verification required state
    // For now, let's try to get session again
    const session = await this.getSession()
    if (!session) {
       // Return a mock session if verification is required but we want to satisfy the return type
       // Better: the UI should handle null session if verification is required
       throw new Error('Email verification required. Please check your inbox.')
    }
    
    return session
  }

  /**
   * Sign Out Current User
   */
  async signOut(): Promise<void> {
    this.currentSession = null
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hubio_session')
    }
  }

  /**
   * Get Current Session
   * 
   * @returns Promise<Session | null>
   */
  async getSession(): Promise<Session | null> {
    try {
      // Get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return null
      }

      // Get user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError || !userProfile) {
        return null
      }

      // Load badges from database (if badges table exists)
      let badges: Badge[] = []
      try {
        // Try to get badges from Supabase if a badges table exists
        // For now, we'll use the in-memory database as fallback
        const { getDatabase } = await import('@/lib/db/schema')
        const db = getDatabase()
        const allBadges = db.getAllBadges()
        // Filter badges for this user (in a real system, you'd have a user_badges table)
        // For now, we'll return empty array as badges are typically stored in a junction table
        badges = []
      } catch (error) {
        // Badges table might not exist, that's okay
        console.warn('Could not load badges:', error)
        badges = []
      }

      // Determine provider from session
      let provider: AuthProvider = 'email'
      if (session.user.app_metadata?.provider) {
        const sessionProvider = session.user.app_metadata.provider
        if (sessionProvider === 'google') provider = 'google'
        else if (sessionProvider === 'github') provider = 'google' // Map to available provider
        else provider = 'email'
      }

      // Convert database user to app User type
      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role as UserRole,
        avatar: userProfile.avatar,
        karma: userProfile.karma || 0,
        badges,
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
        createdAt: new Date(userProfile.created_at),
        lastActiveAt: new Date(userProfile.last_active_at),
      }

      const appSession: Session = {
        user,
        token: session.access_token,
        expiresAt: new Date(session.expires_at! * 1000),
        provider,
      }

      this.currentSession = appSession
      return appSession
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Get Current User
   * 
   * @returns Promise<User | null>
   */
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession()
    return session ? session.user : null
  }

  /**
   * Check if User is Authenticated
   * 
   * @returns Promise<boolean>
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  }

  /**
   * Check if User has Role
   * 
   * @param role - Required role
   * @returns Promise<boolean>
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.role === role || user?.role === 'admin'
  }

  /**
   * Check if User has Any of the Roles
   * 
   * @param roles - Array of roles
   * @returns Promise<boolean>
   */
  async hasAnyRole(roles: UserRole[]): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    return roles.includes(user.role) || user.role === 'admin'
  }

  /**
   * Generate JWT Token
   * 
   * In production, this would use a proper JWT library
   * For demo, we'll create a simple token
   */
  private generateToken(user: User): string {
    // In production, use: jwt.sign({ userId: user.id, email: user.email }, SECRET)
    return btoa(JSON.stringify({ userId: user.id, email: user.email, timestamp: Date.now() }))
  }

  /**
   * Save Session to Storage
   */
  private saveSession(session: Session): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hubio_session', JSON.stringify(session))
    }
  }

  /**
   * Save User to Storage
   */
  private saveUser(user: User): void {
    if (typeof window !== 'undefined') {
      const users = this.getStoredUsers()
      const index = users.findIndex(u => u.id === user.id)
      if (index >= 0) {
        users[index] = user
      } else {
        users.push(user)
      }
      localStorage.setItem('hubio_users', JSON.stringify(users))
    }
  }

  /**
   * Get Stored Users
   */
  private getStoredUsers(): User[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('hubio_users')
      if (stored) {
        const users = JSON.parse(stored)
        // Convert date strings back to Date objects
        return users.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          lastActiveAt: new Date(u.lastActiveAt),
        }))
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
    
    return []
  }
}

// Singleton instance
let authInstance: AuthService | null = null

/**
 * Get Auth Service Instance
 * 
 * @returns AuthService
 */
export function getAuthService(): AuthService {
  if (!authInstance) {
    authInstance = new AuthService()
  }
  return authInstance
}

/**
 * Require Authentication Hook
 * 
 * Use this in API routes or components that require authentication
 */
export async function requireAuth(): Promise<User> {
  const auth = getAuthService()
  const user = await auth.getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require Role Hook
 * 
 * Use this to check if user has required role
 */
export async function requireRole(role: UserRole): Promise<User> {
  const auth = getAuthService()
  const user = await auth.getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (!(await auth.hasRole(role))) {
    throw new Error(`Role '${role}' required`)
  }
  
  return user
}

