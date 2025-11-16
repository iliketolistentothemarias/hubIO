
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import bcrypt from 'bcryptjs';
import Database from '@replit/database';

const db = new Database();

const signupCooldown = new Map<string, number>();
const COOLDOWN_SECONDS = 10;

setInterval(() => {
  const now = Date.now();
  for (const [email, timestamp] of signupCooldown.entries()) {
    if (now - timestamp > COOLDOWN_SECONDS * 1000) {
      signupCooldown.delete(email);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const lastSignup = signupCooldown.get(normalizedEmail);
    if (lastSignup) {
      const timeSinceLastSignup = (Date.now() - lastSignup) / 1000;
      if (timeSinceLastSignup < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - timeSinceLastSignup);
        return NextResponse.json(
          { success: false, error: `Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before signing up again.` },
          { status: 429 }
        );
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.get(`user:${normalizedEmail}`);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: normalizedEmail,
      name,
      passwordHash,
      role: 'resident',
      karma: 0,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    // Store user in Replit DB
    await db.set(`user:${normalizedEmail}`, user);
    await db.set(`user:id:${user.id}`, user);

    signupCooldown.set(normalizedEmail, Date.now());

    const response: ApiResponse<{ user: any }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      message: 'Account created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
