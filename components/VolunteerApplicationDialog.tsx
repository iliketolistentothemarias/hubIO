'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Clock, Calendar, MapPin, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface VolunteerApplicationDialogProps {
  open: boolean
  onClose: () => void
  opportunity: {
    id: string
    title: string
    organization: string
    date: string
    time: string
    location: string
    volunteersNeeded: number
    volunteersSignedUp: number
  }
  onSuccess?: () => void
}

export default function VolunteerApplicationDialog({
  open,
  onClose,
  opportunity,
  onSuccess,
}: VolunteerApplicationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/volunteer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          message: message || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Application failed')
      }

      setSuccess(true)
      
      // Show success toast
      if (typeof window !== 'undefined') {
        const { showToast } = await import('./Toast')
        showToast('Application submitted successfully!', 'success')
      }
      
      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit application')
      
      // Show error toast
      if (typeof window !== 'undefined') {
        const { showToast } = await import('./Toast')
        showToast(err.message || 'Failed to submit application', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError(null)
    setMessage('')
    onClose()
  }

  const spotsLeft = opportunity.volunteersNeeded - opportunity.volunteersSignedUp

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {success ? 'Application Submitted!' : 'Apply to Volunteer'}
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
                  Application Submitted!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your application for <strong>{opportunity.title}</strong> has been submitted successfully.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  You will be notified once your application is reviewed.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Opportunity Details */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {opportunity.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {opportunity.organization}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>{new Date(opportunity.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>{opportunity.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>{opportunity.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining</span>
                    </div>
                  </div>
                </div>

                {spotsLeft <= 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                    This opportunity is full. You will be added to a waitlist.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Why are you interested in this opportunity? (optional)
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us why you'd like to volunteer..."
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

