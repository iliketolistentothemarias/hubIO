/**
 * Make User Admin Script
 * 
 * Makes a user an admin by email
 * Usage: npx tsx scripts/make-admin.ts ameyaparnerkar@gmail.com
 */

import { createAdminClient } from '../lib/supabase/server'

async function makeAdmin(email: string) {
  try {
    const adminClient = createAdminClient()
    if (!adminClient) {
      console.error('Admin client not configured. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
      process.exit(1)
    }

    // Find user by email
    const { data: users, error: findError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .limit(1)

    if (findError) {
      console.error('Error finding user:', findError)
      process.exit(1)
    }

    if (!users || users.length === 0) {
      console.error(`User with email ${email} not found.`)
      process.exit(1)
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
      process.exit(1)
    }

    console.log(`✅ Successfully made ${email} an admin!`)
    console.log(`User ID: ${updatedUser.id}`)
    console.log(`Role: ${updatedUser.role}`)
  } catch (error: any) {
    console.error('Error making user admin:', error)
    process.exit(1)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email>')
  console.error('Example: npx tsx scripts/make-admin.ts ameyaparnerkar@gmail.com')
  process.exit(1)
}

makeAdmin(email)

