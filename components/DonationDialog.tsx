'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, CreditCard, DollarSign, Lock, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
// Stripe integration ready but not required for demo
// import { loadStripe } from '@stripe/stripe-js'
// import {
//   Elements,
//   CardElement,
//   useStripe,
//   useElements,
// } from '@stripe/react-stripe-js'

interface DonationDialogProps {
  open: boolean
  onClose: () => void
  campaign: {
    id: string
    title: string
    goal: number
    raised: number
  }
  onSuccess?: () => void
}

const PRESET_AMOUNTS = [25, 50, 100, 250, 500]

function CheckoutForm({
  amount,
  campaign,
  onSuccess,
  onClose,
}: {
  amount: number
  campaign: { id: string; title: string }
  onSuccess: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      // Process donation (simulated payment for demo)
      const response = await fetch(`/api/campaigns/${campaign.id}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          anonymous,
          message: message || undefined,
          paymentMethod: 'stripe', // In production, would use actual Stripe
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Donation failed')
      }

      // Show success toast
      if (typeof window !== 'undefined') {
        const { showToast } = await import('./Toast')
        showToast(`Thank you for your donation of $${amount.toFixed(2)}!`, 'success')
      }

      onSuccess()
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Donation failed. Please try again.')
      
      // Show error toast
      if (typeof window !== 'undefined') {
        const { showToast } = await import('./Toast')
        showToast(err.message || 'Donation failed', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Demo Mode:</strong> This is a simulated donation. In production, this would process through Stripe or PayPal.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="anonymous"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded"
        />
        <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
          Make this donation anonymous
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Message (optional)
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message to your donation..."
          rows={3}
          className="w-full"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Donate ${amount.toFixed(2)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="w-4 h-4" />
        <span>Secure payment (simulated for demo)</span>
      </div>
    </form>
  )
}

export default function DonationDialog({
  open,
  onClose,
  campaign,
  onSuccess,
}: DonationDialogProps) {
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [step, setStep] = useState<'amount' | 'payment'>('amount')
  const [success, setSuccess] = useState(false)

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount)
    setCustomAmount('')
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue)
    }
  }

  const handleContinue = () => {
    if (amount > 0) {
      setStep('payment')
    }
  }

  const handleSuccess = () => {
    setSuccess(true)
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleClose = () => {
    setStep('amount')
    setAmount(50)
    setCustomAmount('')
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {success ? 'Thank You!' : 'Make a Donation'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Donation Successful!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Thank you for supporting <strong>{campaign.title}</strong>
                  </p>
                  <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                    ${amount.toFixed(2)} donated
                  </p>
                </motion.div>
              ) : step === 'amount' ? (
                <motion.div
                  key="amount"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Select Amount
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {PRESET_AMOUNTS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleAmountSelect(preset)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            amount === preset && customAmount === ''
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                          }`}
                        >
                          <DollarSign className="w-6 h-6 mx-auto mb-1" />
                          <div className="font-semibold">${preset}</div>
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Amount
                      </label>
                      <Input
                        type="number"
                        value={customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="1"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Donation Amount</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={amount <= 0}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-semibold"
                  >
                    Continue to Payment
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => setStep('amount')}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      ← Change amount
                    </button>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Donating to:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {campaign.title}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CheckoutForm
                    amount={amount}
                    campaign={campaign}
                    onSuccess={handleSuccess}
                    onClose={handleClose}
                  />
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

