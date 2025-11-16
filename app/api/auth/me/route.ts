import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      role: string
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        'SELECT id, email, name, role, avatar, karma, created_at FROM users WHERE id = $1',
        [decoded.userId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { user: result.rows[0] },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    )
  }
}
