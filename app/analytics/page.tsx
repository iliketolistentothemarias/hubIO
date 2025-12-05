'use client'

import AdvancedAnalytics from '@/components/AdvancedAnalytics'
import AuthRequired from '@/components/auth/AuthRequired'

export default function AnalyticsPage() {
  return (
    <AuthRequired featureName="advanced analytics" description="Analytics are reserved for members so your personal trends stay private. Create an account to unlock insights.">
      <AdvancedAnalytics />
    </AuthRequired>
  )
}

