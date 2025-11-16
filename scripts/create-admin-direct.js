
/**
 * Create Admin Account Directly in Replit Database
 * Run with: node scripts/create-admin-direct.js
 */

const Database = require('@replit/database');
const bcrypt = require('bcryptjs');

const db = new Database();

const email = 'ameyaparnerkar@gmail.com';
const password = 'Ameya0525';
const name = 'Ameya Parnerkar';

async function createAdminAccount() {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await db.get(`user:${normalizedEmail}`);
    
    if (existingUser) {
      console.log('User already exists, updating to admin role...');
      existingUser.role = 'admin';
      await db.set(`user:${normalizedEmail}`, existingUser);
      await db.set(`user:id:${existingUser.id}`, existingUser);
      console.log('✅ User updated to admin!');
    } else {
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: normalizedEmail,
        name,
        passwordHash,
        role: 'admin',
        karma: 0,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      // Store user in Replit DB
      await db.set(`user:${normalizedEmail}`, user);
      await db.set(`user:id:${user.id}`, user);

      console.log('✅ Admin account created successfully!');
    }
    
    console.log('\n=== Account Details ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('\nYou can now login at: http://localhost:5000/login');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminAccount();
