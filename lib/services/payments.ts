/**
 * Payment Service
 * 
 * Handles payment processing with Stripe and PayPal integration
 */

// Optional Stripe import - will be null if not installed
let Stripe: any = null
try {
  Stripe = require('stripe')
} catch (e) {
  // Stripe not installed - will use mock payment processing
  console.warn('Stripe not installed, using mock payment processing')
}

import { Donation, FundraisingCampaign } from '@/lib/types'

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed'
  clientSecret?: string
  paymentMethod?: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  error?: string
  receiptUrl?: string
}

export class PaymentService {
  private stripe: any = null
  private paypalClientId: string | null = null

  constructor() {
    // Initialize Stripe (if available)
    if (Stripe) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY
      if (stripeSecretKey) {
        try {
          this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-06-20.acacia',
          })
        } catch (error) {
          console.warn('Failed to initialize Stripe:', error)
        }
      }
    }

    // Initialize PayPal
    this.paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null
  }

  /**
   * Create Stripe Payment Intent
   */
  async createStripePaymentIntent(
    amount: number,
    campaignId: string,
    userId: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    // If Stripe is not configured, simulate payment for demo
    if (!this.stripe) {
      // Return a mock payment intent for demo purposes
      return {
        id: `pi_mock_${Date.now()}`,
        amount,
        currency: 'usd',
        status: 'succeeded', // Simulate immediate success for demo
        clientSecret: `pi_mock_${Date.now()}_secret`,
      }
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        campaignId,
        userId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status as 'pending' | 'succeeded' | 'failed',
      clientSecret: paymentIntent.client_secret || undefined,
    }
  }

  /**
   * Confirm Stripe Payment
   */
  async confirmStripePayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : {}
      )

      if (paymentIntent.status === 'succeeded') {
        const charge = paymentIntent.charges.data[0]
        return {
          success: true,
          paymentId: paymentIntent.id,
          receiptUrl: charge?.receipt_url || undefined,
        }
      }

      return {
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment confirmation failed',
      }
    }
  }

  /**
   * Create PayPal Order
   */
  async createPayPalOrder(
    amount: number,
    campaignId: string,
    userId: string
  ): Promise<{ orderId: string; approvalUrl?: string }> {
    // In production, this would call PayPal API
    // For now, return a mock order ID
    return {
      orderId: `paypal_${Date.now()}_${campaignId}`,
      approvalUrl: undefined,
    }
  }

  /**
   * Capture PayPal Payment
   */
  async capturePayPalPayment(orderId: string): Promise<PaymentResult> {
    // In production, this would call PayPal API to capture the order
    // For now, simulate success
    return {
      success: true,
      paymentId: orderId,
    }
  }

  /**
   * Process Refund
   */
  async processRefund(
    paymentId: string,
    amount: number,
    reason?: string
  ): Promise<PaymentResult> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      // Determine if it's a Stripe payment
      if (paymentId.startsWith('pi_')) {
        const refund = await this.stripe.refunds.create({
          payment_intent: paymentId,
          amount: Math.round(amount * 100),
          reason: reason || 'requested_by_customer',
        })

        return {
          success: refund.status === 'succeeded',
          paymentId: refund.id,
          error: refund.status !== 'succeeded' ? 'Refund failed' : undefined,
        }
      }

      // PayPal refund would be handled here
      return {
        success: false,
        error: 'Refund method not supported for this payment type',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Refund failed',
      }
    }
  }

  /**
   * Get Payment Status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent | null> {
    if (!this.stripe) {
      return null
    }

    try {
      if (paymentId.startsWith('pi_')) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId)
        return {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status as 'pending' | 'succeeded' | 'failed',
        }
      }
    } catch (error) {
      console.error('Error retrieving payment status:', error)
    }

    return null
  }

  /**
   * Verify Webhook Signature (Stripe)
   */
  verifyStripeWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): any | null {
    if (!this.stripe) {
      return null
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return null
    }
  }

  /**
   * Handle Stripe Webhook Event
   */
  async handleStripeWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment succeeded - update donation status
        const paymentIntent = event.data.object
        // This will be handled by the webhook route
        break

      case 'payment_intent.payment_failed':
        // Payment failed - update donation status
        break

      case 'charge.refunded':
        // Refund processed
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }
}

// Singleton instance
let paymentServiceInstance: PaymentService | null = null

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService()
  }
  return paymentServiceInstance
}

