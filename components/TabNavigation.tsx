'use client'

/**
 * Tab Navigation Component
 * 
 * Provides tabbed navigation for different sections of the platform.
 * Used throughout the application for organizing content.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon?: LucideIcon
  count?: number
  badge?: string
}

interface TabNavigationProps {
  tabs: Tab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  children: (activeTab: string) => React.ReactNode
  className?: string
}

export default function TabNavigation({ 
  tabs, 
  defaultTab, 
  onTabChange, 
  children,
  className = '' 
}: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-6 py-3 rounded-t-2xl font-medium transition-all duration-200 flex items-center gap-2
                ${
                  isActive
                    ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] shadow-sm'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                }`}
              style={{
                backdropFilter: isActive ? 'none' : 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: isActive ? 'none' : 'saturate(180%) blur(20px)',
              }}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children(activeTab)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

