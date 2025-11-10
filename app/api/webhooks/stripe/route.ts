/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { getPaymentService } from '@/lib/services/payments'
import { Donation } from '@/lib/types'
import Stripe from 'stripe'

const db = getDatabase()
const supabaseDb = getSupabaseDatabase()
const paymentService = getPaymentService()

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Verify webhook signature
  const event = paymentService.verifyStripeWebhook(body, signature, webhookSecret)

  if (!event) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { campaignId, userId } = paymentIntent.metadata

        if (campaignId && userId) {
          // Create completed donation record
          const donation: Donation = {
            id: `donation_${paymentIntent.id}`,
            campaignId,
            userId,
            amount: paymentIntent.amount / 100,
            anonymous: paymentIntent.metadata.anonymous === 'true',
            message: paymentIntent.metadata.message,
            paymentMethod: 'stripe',
            status: 'completed',
            createdAt: new Date(paymentIntent.created * 1000),
          }

          db.createDonation(donation)

          // Get campaign
          const supabaseDb = getSupabaseDatabase()
          let campaign
          try {
            campaign = await supabaseDb.getCampaignById(campaignId)
          } catch (error) {
            campaign = db.getCampaign(campaignId)
          }

          // Update user karma
          const user = db.getUser(userId)
          if (user) {
            db.updateUser(userId, {
              karma: user.karma + Math.floor(donation.amount / 10), // 1 karma per $10
            })

            // Send confirmation email if campaign exists
            if (campaign) {
              try {
                // Note: Email service would need to be implemented
                // For now, we'll log it
                console.log(`Donation receipt should be sent to ${user.email} for donation of $${donation.amount} to ${campaign.title}`)
                // TODO: Implement email service when available
                // const { getEmailService } = await import('@/lib/services/email')
                // const emailService = getEmailService()
                // await emailService.sendDonationReceipt(donation, campaign, user)
              } catch (emailError) {
                console.error('Error sending donation receipt email:', emailError)
                // Don't fail the webhook if email fails
              }
            }
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { campaignId, userId } = paymentIntent.metadata

        if (campaignId && userId) {
          // Create failed donation record
          const donation: Donation = {
            id: `donation_${paymentIntent.id}`,
            campaignId,
            userId,
            amount: paymentIntent.amount / 100,
            anonymous: paymentIntent.metadata.anonymous === 'true',
            message: paymentIntent.metadata.message,
            paymentMethod: 'stripe',
            status: 'failed',
            createdAt: new Date(paymentIntent.created * 1000),
          }

          db.createDonation(donation)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          // Find donation and mark as refunded
          // This would require extending the Donation type to include refund status
          // For now, we'll log it
          console.log('Refund processed for payment intent:', paymentIntentId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error handling webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

