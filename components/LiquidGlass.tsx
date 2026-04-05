'use client'

import { motion } from 'framer-motion'

interface LiquidGlassProps {
  children: React.ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'strong'
}

export default function LiquidGlass({ children, className = '', intensity = 'medium' }: LiquidGlassProps) {
  const blurIntensity = {
    light: 'blur(20px)',
    medium: 'blur(30px)',
    strong: 'blur(40px)',
  }

  return (
    <div className={`relative ${className}`}>
      {/* Minimal background - clean and simple */}
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-white dark:bg-[#1F1B28] border border-[#E8E0D6] dark:border-[#2c2c3e]">
      </div>

      {/* Content */}
      <div className="relative z-10 rounded-xl">
        {children}
      </div>
    </div>
  )
}

