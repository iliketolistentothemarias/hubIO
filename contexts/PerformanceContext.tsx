'use client'

import { createContext, useContext, ReactNode } from 'react'

// Disable all animations for maximum speed
const PerformanceContext = createContext({ animationsEnabled: false })

export function PerformanceProvider({ children }: { children: ReactNode }) {
  return (
    <PerformanceContext.Provider value={{ animationsEnabled: false }}>
      {children}
    </PerformanceContext.Provider>
  )
}

export const usePerformance = () => useContext(PerformanceContext)

