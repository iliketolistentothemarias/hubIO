import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
        [email.toLowerCase()]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const user = result.rows[0]

      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      await client.query(
        'UPDATE users SET last_active_at = NOW() WHERE id = $1',
        [user.id]
      )

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      })

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })

      return response
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
