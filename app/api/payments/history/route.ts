/**
 * Payment History API Route
 * 
 * Returns donation history for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/payments/history
 * 
 * Get payment/donation history for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const donations = db.getDonationsByUser(user.id)

    // Get campaign details for each donation
    const donationsWithCampaigns = donations.map((donation) => {
      const campaign = db.getCampaign(donation.campaignId)
      return {
        ...donation,
        campaign: campaign
          ? {
              id: campaign.id,
              title: campaign.title,
              category: campaign.category,
            }
          : null,
      }
    })

    const response: ApiResponse<typeof donationsWithCampaigns> = {
      success: true,
      data: donationsWithCampaigns,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching payment history:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}

