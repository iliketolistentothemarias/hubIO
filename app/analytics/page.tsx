'use client'

import dynamic from 'next/dynamic'
import AuthRequired from '@/components/auth/AuthRequired'

const AdvancedAnalytics = dynamic(() => import('@/components/AdvancedAnalytics'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center pt-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B6F47] dark:border-[#D4A574] border-t-transparent" />
    </div>
  ),
})

export default function AnalyticsPage() {
  return (
    <AuthRequired
      featureName="advanced analytics"
      description="Analytics are reserved for members so your personal trends stay private. Create an account to unlock insights."
    >
      <AdvancedAnalytics />
    </AuthRequired>
  )
}
