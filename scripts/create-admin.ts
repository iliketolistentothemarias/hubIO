/**
 * Create Admin Account Script
 * 
 * Creates a default admin account for the application.
 * Run with: npx tsx scripts/create-admin.ts
 */

import { getDatabase } from '../lib/db/schema'
import { getAuthService } from '../lib/auth'

const db = getDatabase()
const auth = getAuthService()

// Admin account details
const adminEmail = 'admin@hubio.org'
const adminPassword = 'admin123'
const adminName = 'Admin User'

async function createAdmin() {
  try {
    // Check if admin already exists by trying to get all users
    const allUsers = Array.from(db['db'].users.values())
    const existingUser = allUsers.find(u => u.email === adminEmail)
    if (existingUser) {
      console.log('Admin account already exists!')
      return
    }

    // Create admin user using signUp and then update role
    const session = await auth.signUp(adminEmail, adminPassword, adminName)
    let user = session.user
    
    // Update user role to admin
    const updatedUser = db.updateUser(user.id, { role: 'admin' })
    if (updatedUser) {
      user = updatedUser
    }

    console.log('✅ Admin account created successfully!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('Role: admin')
    console.log('\n⚠️  Please change the password after first login!')
  } catch (error: any) {
    console.error('❌ Error creating admin account:', error.message)
  }
}

createAdmin()

