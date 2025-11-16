import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
    }

    const {
      name,
      category,
      description,
      address,
      phone,
      email,
      website,
      tags,
      hours,
      services,
      languages,
      accessibility,
    } = await request.json()

    if (!name || !category || !description || !address || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        `INSERT INTO resources (
          name, category, description, address, phone, email, website,
          tags, hours, services, languages, accessibility,
          submitted_by, status, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, name, category, status, created_at`,
        [
          name,
          category,
          description,
          address,
          phone,
          email,
          website || null,
          tags || [],
          hours || null,
          services || [],
          languages || [],
          accessibility || [],
          decoded.userId,
          'pending',
          false,
        ]
      )

      return NextResponse.json({
        success: true,
        data: { resource: result.rows[0] },
        message: 'Resource submitted successfully! It will be reviewed by our admins.',
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Resource submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
