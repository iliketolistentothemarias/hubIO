
/**
 * Create Specific Admin Account
 * Run with: node scripts/create-specific-admin.ts
 */

const email = 'ameyaparnerkar@gmail.com';
const password = 'Ameya0525';
const name = 'Ameya Parnerkar';

async function createAdminAccount() {
  try {
    console.log('Creating account...');
    
    // First, create the account via signup
    const signupResponse = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    const signupData = await signupResponse.json();
    
    if (!signupData.success) {
      console.error('Signup failed:', signupData.error);
      if (signupData.error.includes('already registered')) {
        console.log('Account already exists, proceeding to login...');
      } else {
        return;
      }
    } else {
      console.log('✅ Account created successfully!');
    }

    // Login to get the token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.error);
      return;
    }

    const token = loginData.data.token;
    const userId = loginData.data.user.id;

    console.log('✅ Logged in successfully!');
    console.log('User ID:', userId);

    // Update role to admin
    console.log('Updating to admin role...');
    const updateResponse = await fetch('http://localhost:5000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        role: 'admin',
      }),
    });

    const updateData = await updateResponse.json();
    
    if (!updateData.success) {
      console.error('Failed to update role:', updateData.error);
      console.log('\nManual steps required:');
      console.log('1. Create another admin account first');
      console.log('2. Login as that admin');
      console.log('3. Go to /admin/dashboard');
      console.log('4. Update this user to admin role');
      return;
    }

    console.log('\n✅ SUCCESS! Account created with admin access!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('\nYou can now login at: http://localhost:5000/login');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdminAccount();
