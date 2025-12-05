import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      )

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const result = await client.query(
        `INSERT INTO users (email, name, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, role, created_at`,
        [email.toLowerCase(), name, hashedPassword, 'volunteer']
      )

      const user = result.rows[0]

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
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
