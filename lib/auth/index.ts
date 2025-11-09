/**
 * Authentication Service
 * 
 * Handles user authentication, authorization, and session management.
 * Supports multiple auth providers (OAuth, email/password, etc.)
 * 
 * In production, this would integrate with:
 * - NextAuth.js for OAuth providers
 * - Supabase Auth
 * - Firebase Auth
 * - Custom JWT-based auth
 */

import { User, UserRole } from '@/lib/types'

/**
 * Authentication Provider Types
 */
export type AuthProvider = 'google' | 'microsoft' | 'github' | 'email' | 'school'

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
      role: 'resident',
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
    // In production, this would verify credentials against database
    // For demo, we'll check localStorage for existing users
    
    const storedUsers = this.getStoredUsers()
    let user = storedUsers.find(u => u.email === email)

    if (!user) {
      // Create new user if doesn't exist (for demo)
      user = {
        id: `user_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'resident',
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
      this.saveUser(user)
    }

    const session: Session = {
      user,
      token: this.generateToken(user),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      provider: 'email',
    }

    this.currentSession = session
    this.saveSession(session)
    
    return session
  }

  /**
   * Sign Up New User
   * 
   * @param email - User email
   * @param password - User password
   * @param name - User name
   * @returns Promise<Session>
   */
  async signUp(email: string, password: string, name: string): Promise<Session> {
    // Check if user already exists
    const storedUsers = this.getStoredUsers()
    if (storedUsers.find(u => u.email === email)) {
      throw new Error('User with this email already exists')
    }

    // Create new user
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      role: 'resident',
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

    this.saveUser(user)

    const session: Session = {
      user,
      token: this.generateToken(user),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      provider: 'email',
    }

    this.currentSession = session
    this.saveSession(session)
    
    return session
  }

  /**
   * Sign Out Current User
   */
  signOut(): void {
    this.currentSession = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hubio_session')
    }
  }

  /**
   * Get Current Session
   * 
   * @returns Session | null
   */
  getSession(): Session | null {
    if (this.currentSession) {
      return this.currentSession
    }

    // Try to load from storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hubio_session')
      if (stored) {
        try {
          const session = JSON.parse(stored)
          // Check if session is still valid
          if (new Date(session.expiresAt) > new Date()) {
            this.currentSession = {
              ...session,
              user: { ...session.user, lastActiveAt: new Date() },
            }
            return this.currentSession
          } else {
            // Session expired
            localStorage.removeItem('hubio_session')
          }
        } catch (error) {
          console.error('Failed to parse session:', error)
        }
      }
    }

    return null
  }

  /**
   * Get Current User
   * 
   * @returns User | null
   */
  getCurrentUser(): User | null {
    const session = this.getSession()
    return session ? session.user : null
  }

  /**
   * Check if User is Authenticated
   * 
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  /**
   * Check if User has Role
   * 
   * @param role - Required role
   * @returns boolean
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser()
    return user?.role === role || user?.role === 'admin'
  }

  /**
   * Check if User has Any of the Roles
   * 
   * @param roles - Array of roles
   * @returns boolean
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser()
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
export function requireAuth(): User {
  const auth = getAuthService()
  const user = auth.getCurrentUser()
  
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
export function requireRole(role: UserRole): User {
  const auth = getAuthService()
  const user = auth.getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (!auth.hasRole(role)) {
    throw new Error(`Role '${role}' required`)
  }
  
  return user
}

