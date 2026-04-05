'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileText } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/20 pt-20">
      <div className="container-custom section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Collection</h2>
              <p className="text-gray-600 dark:text-gray-400">
                We collect information you provide directly to us, including when you create an account,
                submit resources, RSVP to events, or make donations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Rights</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Right to Access</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You can request a copy of all data we have about you.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Right to Deletion</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You can request deletion of your personal data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Right to Rectification</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You can update your personal information at any time.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Security</h2>
              <p className="text-gray-600 dark:text-gray-400">
                We implement industry-standard security measures to protect your data, including encryption,
                secure authentication, and regular security audits.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

