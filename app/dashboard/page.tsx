'use client'

/**
 * Dashboard Page
 * 
 * Personalized dashboard for authenticated users.
 * Shows quick actions and community stats.
 */

import Dashboard from '@/components/Dashboard'
import AuthRequired from '@/components/auth/AuthRequired'

export default function DashboardPage() {
  return (
    <AuthRequired featureName="your personalized dashboard" description="Track your activity, manage favorites, and access personalized community insights after creating an account.">
      <Dashboard />
    </AuthRequired>
  )
}

