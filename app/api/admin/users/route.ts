import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import jwt from 'jsonwebtoken';
import Database from '@replit/database';

const db = new Database();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = await db.get(`user:id:${decoded.userId}`);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all users from Replit DB
    const allKeys = await db.list('user:');
    const users = [];

    for (const key of allKeys) {
      if (key.startsWith('user:') && !key.startsWith('user:id:')) {
        const user = await db.get(key);
        if (user) {
          users.push({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: user.createdAt,
          });
        }
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: users,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = await db.get(`user:id:${decoded.userId}`);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['resident', 'volunteer', 'organizer', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    if (userId === decoded.userId && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own admin status' },
        { status: 400 }
      );
    }

    const user = await db.get(`user:id:${userId}`);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    user.role = role;
    await db.set(`user:${user.email}`, user);
    await db.set(`user:id:${user.id}`, user);

    const response: ApiResponse<any> = {
      success: true,
      message: `User role updated to ${role}`,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}