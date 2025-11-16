import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/helpers';
import { ApiResponse } from '@/lib/types';
import { sign } from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set');
}

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomUUID();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.users.verifyPassword(email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await db.users.updateLastActive(user.id);

    const token = sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response: ApiResponse<{ user: any; token: string }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          karma: user.karma,
        },
        token,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
