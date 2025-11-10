/**
 * Donation API Route
 * 
 * Handles donation processing for fundraising campaigns.
 * 
 * Endpoints:
 * - POST /api/campaigns/[id]/donate - Process donation
 * 
 * Integrates with:
 * - Stripe for payment processing
 * - PayPal for alternative payments
 * - Payment gateway webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { getPaymentService } from '@/lib/services/payments'
import { ApiResponse, Donation } from '@/lib/types'

const db = getDatabase()
const paymentService = getPaymentService()

/**
 * POST /api/campaigns/[id]/donate
 * 
 * Process a donation to a campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate donation amount
    const amount = parseFloat(body.amount)
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation amount' },
        { status: 400 }
      )
    }

    if (amount < 1) {
      return NextResponse.json(
        { success: false, error: 'Minimum donation amount is $1.00' },
        { status: 400 }
      )
    }

    // Get campaign
    const campaign = db.getCampaign(params.id)
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    const paymentMethod = body.paymentMethod || 'stripe'

    // Create payment intent based on payment method
    if (paymentMethod === 'stripe') {
      try {
        const paymentIntent = await paymentService.createStripePaymentIntent(
          amount,
          params.id,
          user.id,
          {
            campaignTitle: campaign.title,
            userName: user.name,
            userEmail: user.email,
          }
        )

        // Create donation record
        const donation: Donation = {
          id: `donation_${Date.now()}`,
          campaignId: params.id,
          userId: user.id,
          amount,
          anonymous: body.anonymous || false,
          message: body.message,
          paymentMethod: 'stripe',
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
          createdAt: new Date(),
        }

        // Save donation to database
        db.createDonation(donation)

        // Update campaign raised amount
        const updatedCampaign = {
          ...campaign,
          raised: campaign.raised + amount,
          donors: campaign.donors + 1,
          updatedAt: new Date(),
        }
        db.createCampaign(updatedCampaign)

        return NextResponse.json({
          success: true,
          data: {
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            donationId: donation.id,
          },
          message: paymentIntent.status === 'succeeded' ? 'Donation processed successfully' : 'Payment intent created',
        })
      } catch (error: any) {
        console.error('Error creating payment intent:', error)
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to create payment intent' },
          { status: 500 }
        )
      }
    } else if (paymentMethod === 'paypal') {
      // PayPal integration
      const order = await paymentService.createPayPalOrder(amount, params.id, user.id)

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.orderId,
          approvalUrl: order.approvalUrl,
        },
        message: 'PayPal order created',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error processing donation:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process donation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/campaigns/[id]/donate
 * 
 * Get donation history for a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const donations = db.getDonationsByCampaign(params.id)

    return NextResponse.json({
      success: true,
      data: donations,
    })
  } catch (error: any) {
    console.error('Error fetching donations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}

