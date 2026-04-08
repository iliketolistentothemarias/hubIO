'use client'

import { ReactNode } from 'react'

interface AuthRequiredProps {
  featureName: string
  description?: string
  children: ReactNode
}

/**
 * Previously gated pages behind a sign-in wall. The app now allows guests to
 * browse; children always render. Props are kept so existing pages don’t need edits.
 */
export default function AuthRequired({ children }: AuthRequiredProps) {
  return <>{children}</>
}
