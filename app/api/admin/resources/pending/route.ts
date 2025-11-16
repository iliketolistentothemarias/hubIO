import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
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
      role: string
    }

    if (decoded.role !== 'admin' && decoded.role !== 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        `SELECT 
          r.*,
          u.name as submitter_name,
          u.email as submitter_email
        FROM resources r
        LEFT JOIN users u ON r.submitted_by = u.id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC`
      )

      return NextResponse.json({
        success: true,
        data: { resources: result.rows },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Fetch pending resources error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
