/**
 * Email Service
 * 
 * Handles sending transactional emails (donation receipts, notifications, etc.)
 */

import { Donation, FundraisingCampaign, User } from '@/lib/types'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  /**
   * Send donation receipt email
   */
  async sendDonationReceipt(
    donation: Donation,
    campaign: FundraisingCampaign,
    user: User
  ): Promise<boolean> {
    const receiptHtml = this.generateDonationReceiptHtml(donation, campaign, user)
    const receiptText = this.generateDonationReceiptText(donation, campaign, user)

    return this.sendEmail({
      to: user.email,
      subject: `Thank you for your donation to ${campaign.title}`,
      html: receiptHtml,
      text: receiptText,
    })
  }

  /**
   * Send email notification
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // In production, this would integrate with:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    // - Nodemailer with SMTP

    // For now, log the email (in production, this would actually send)
    console.log('Email would be sent:', {
      to: options.to,
      subject: options.subject,
    })

    // Simulate email sending
    return Promise.resolve(true)
  }

  /**
   * Generate donation receipt HTML
   */
  private generateDonationReceiptHtml(
    donation: Donation,
    campaign: FundraisingCampaign,
    user: User
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Donation Receipt</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B6F47 0%, #D4A574 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Thank You for Your Donation!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear ${user.name},</p>
            
            <p>Thank you for your generous donation to <strong>${campaign.title}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B6F47;">
              <h2 style="margin-top: 0; color: #8B6F47;">Donation Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Campaign:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${campaign.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">$${donation.amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${donation.paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${donation.createdAt.toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${donation.id}</td>
                </tr>
              </table>
            </div>

            ${donation.message ? `
              <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a90e2;">
                <strong>Your Message:</strong>
                <p style="margin: 10px 0 0 0; font-style: italic;">"${donation.message}"</p>
              </div>
            ` : ''}

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Campaign Progress:</strong></p>
              <p style="margin: 5px 0;">$${campaign.raised.toLocaleString()} raised of $${campaign.goal.toLocaleString()} goal</p>
              <div style="background: #ddd; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                <div style="background: #4caf50; height: 100%; width: ${(campaign.raised / campaign.goal * 100).toFixed(0)}%;"></div>
              </div>
            </div>

            <p>Your contribution makes a real difference in our community. We appreciate your support!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The HubIO Team</strong>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              This is an automated receipt. Please keep this email for your records.<br>
              If you have any questions, please contact us at support@hubio.org
            </p>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Generate donation receipt plain text
   */
  private generateDonationReceiptText(
    donation: Donation,
    campaign: FundraisingCampaign,
    user: User
  ): string {
    return `
Thank You for Your Donation!

Dear ${user.name},

Thank you for your generous donation to ${campaign.title}.

Donation Details:
- Campaign: ${campaign.title}
- Amount: $${donation.amount.toFixed(2)}
- Payment Method: ${donation.paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal'}
- Date: ${donation.createdAt.toLocaleDateString()}
- Transaction ID: ${donation.id}

${donation.message ? `Your Message: "${donation.message}"\n` : ''}

Campaign Progress:
$${campaign.raised.toLocaleString()} raised of $${campaign.goal.toLocaleString()} goal

Your contribution makes a real difference in our community. We appreciate your support!

Best regards,
The HubIO Team

---
This is an automated receipt. Please keep this email for your records.
If you have any questions, please contact us at support@hubio.org
    `.trim()
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService()
  }
  return emailServiceInstance
}

