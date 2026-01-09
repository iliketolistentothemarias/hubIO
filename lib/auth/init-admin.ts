/**
 * Initialize Admin Account
 * 
 * Creates a default admin account on first load if it doesn't exist.
 * This runs automatically when the auth service is initialized.
 */

import { getDatabase } from '@/lib/db/schema'
import { getAuthService } from './index'

const ADMIN_EMAIL = 'admin@hubio.org'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_NAME = 'Admin User'

export function initializeAdmin() {
  if (typeof window === 'undefined') return // Server-side only check
  
  try {
    const db = getDatabase()
    const auth = getAuthService()
    
    // Check if admin exists
    const existingAdmin = db.getUserByEmail(ADMIN_EMAIL)
    if (existingAdmin) {
      return // Admin already exists
    }
    
    // Create admin user
    const adminUser: any = {
      id: `admin_${Date.now()}`,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
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
    
    // Save to database
    db.createUser(adminUser)
    
    // Save auth credentials (demo only)
    const storedUsers = (auth as any).getStoredUsers() || []
    storedUsers.push({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      userId: adminUser.id,
    })
    localStorage.setItem('hubio_auth_users', JSON.stringify(storedUsers))
    
    console.log('✅ Admin account initialized!')
    console.log('Email:', ADMIN_EMAIL)
    console.log('Password:', ADMIN_PASSWORD)
  } catch (error) {
    console.error('Failed to initialize admin:', error)
  }
}

// Auto-initialize on client-side
if (typeof window !== 'undefined') {
  // Run after a short delay to ensure database is ready
  setTimeout(() => {
    initializeAdmin()
  }, 1000)
}

