/**
 * Create Specific Admin Account
 * Run with: node scripts/create-specific-admin.ts
 * 
 * IMPORTANT: This script has been disabled for security reasons.
 * Hardcoded credentials should never be stored in source code.
 * 
 * To create an admin account:
 * 1. Sign up normally at /signup
 * 2. Use the database directly to update the user's role to 'admin'
 * 3. Or have an existing admin promote the user through the admin dashboard
 */

console.log('This script has been disabled for security reasons.');
console.log('Hardcoded credentials should not be stored in source code.');
console.log('\nTo create an admin account:');
console.log('1. Sign up normally at /signup');
console.log('2. Connect to your database and run:');
console.log("   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';");
console.log('3. Or have an existing admin promote the user through /admin/dashboard');