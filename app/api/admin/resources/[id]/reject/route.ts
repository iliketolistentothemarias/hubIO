import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string
        role: string
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (decoded.role !== 'admin' && decoded.role !== 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { reason } = await request.json()

    const client = await pool.connect()

    try {
      const result = await client.query(
        `UPDATE resources 
         SET status = 'rejected', 
             reviewed_by = $1, 
             reviewed_at = NOW(),
             rejection_reason = $2
         WHERE id = $3
         RETURNING id, name, status`,
        [decoded.userId, reason || 'No reason provided', params.id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { resource: result.rows[0] },
        message: 'Resource rejected',
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Reject resource error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
