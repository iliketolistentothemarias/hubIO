/**
 * Refund API Route
 * 
 * Handles refund processing for donations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { getPaymentService } from '@/lib/services/payments'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()
const paymentService = getPaymentService()

/**
 * POST /api/payments/refund
 * 
 * Process a refund for a donation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { donationId, reason } = body

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Donation ID is required' },
        { status: 400 }
      )
    }

    // Get donation
    const donation = db.getDonation(donationId)
    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Verify user owns the donation or is admin
    if (donation.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if donation is eligible for refund (within 30 days)
    const daysSinceDonation =
      (Date.now() - donation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceDonation > 30) {
      return NextResponse.json(
        { success: false, error: 'Refund period has expired (30 days)' },
        { status: 400 }
      )
    }

    // Process refund
    const refundResult = await paymentService.processRefund(
      donation.paymentMethod === 'stripe' ? `pi_${donation.id}` : donation.id,
      donation.amount,
      reason
    )

    if (!refundResult.success) {
      return NextResponse.json(
        { success: false, error: refundResult.error || 'Refund failed' },
        { status: 500 }
      )
    }

    // Update donation status (would need to extend type)
    // For now, we'll just return success

    // Update campaign totals
    const campaign = db.getCampaign(donation.campaignId)
    if (campaign) {
      db.updateCampaign(donation.campaignId, {
        raised: Math.max(0, campaign.raised - donation.amount),
        donors: Math.max(0, campaign.donors - 1),
      })
    }

    // Update user karma
    const updatedUser = db.getUser(donation.userId)
    if (updatedUser) {
      const karmaToRemove = Math.floor(donation.amount / 10)
      db.updateUser(donation.userId, {
        karma: Math.max(0, updatedUser.karma - karmaToRemove),
      })
    }

    const response: ApiResponse<{ refundId: string }> = {
      success: true,
      data: {
        refundId: refundResult.paymentId || 'refund_' + Date.now(),
      },
      message: 'Refund processed successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error processing refund:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}

