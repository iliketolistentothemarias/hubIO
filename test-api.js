/**
 * Test Script for HubIO API
 * 
 * Tests signup, login, and admin functionality
 * 
 * Usage: node test-api.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyiqvodabfsovjjgjdxs.supabase.co'
const API_BASE = 'http://localhost:3001'

async function testSignup() {
  console.log('\n=== Testing Signup ===')
  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'test123456',
        name: 'Test User'
      })
    })
    const result = await response.json()
    console.log('Signup result:', result)
    return result
  } catch (error) {
    console.error('Signup error:', error)
    return null
  }
}

async function testLogin(email, password) {
  console.log('\n=== Testing Login ===')
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const result = await response.json()
    console.log('Login result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '')
    return result
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

async function testAdminUsers(sessionToken) {
  console.log('\n=== Testing Admin Users API ===')
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${sessionToken}`
      },
      credentials: 'include'
    })
    const result = await response.json()
    console.log('Admin users result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '')
    if (result.success) {
      console.log(`Found ${result.data?.length || 0} users`)
    }
    return result
  } catch (error) {
    console.error('Admin users error:', error)
    return null
  }
}

async function testUpdateUserRole(sessionToken, userId, role) {
  console.log(`\n=== Testing Update User Role to ${role} ===`)
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${sessionToken}`
      },
      credentials: 'include',
      body: JSON.stringify({ userId, role })
    })
    const result = await response.json()
    console.log('Update role result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '')
    return result
  } catch (error) {
    console.error('Update role error:', error)
    return null
  }
}

// Run tests
async function runTests() {
  console.log('Starting API Tests...')
  console.log('API Base URL:', API_BASE)
  console.log('Supabase URL:', SUPABASE_URL)
  
  // Test 1: Signup
  const signupResult = await testSignup()
  if (!signupResult?.success) {
    console.log('\n❌ Signup failed. Cannot continue tests.')
    return
  }
  
  const testEmail = signupResult.data?.user?.email
  const testPassword = 'test123456'
  
  // Test 2: Login
  const loginResult = await testLogin(testEmail, testPassword)
  if (!loginResult?.success) {
    console.log('\n❌ Login failed. Cannot continue tests.')
    return
  }
  
  console.log('\n✅ All basic tests passed!')
  console.log('\nNote: Admin tests require an admin user. Please:')
  console.log('1. Create an admin user in Supabase')
  console.log('2. Login as admin')
  console.log('3. Test admin functionality in the browser')
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testSignup, testLogin, testAdminUsers, testUpdateUserRole }

