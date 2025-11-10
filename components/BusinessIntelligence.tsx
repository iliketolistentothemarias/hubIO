'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Filter, FileText } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

export default function BusinessIntelligence() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    loadMetrics()
  }, [dateRange])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/business?range=${dateRange}`)
      const data = await response.json()
      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&range=${dateRange}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${dateRange}.${format}`
      a.click()
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Business Intelligence</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4 inline mr-2" />
              CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Users', value: metrics?.users || 0, change: '+12%' },
          { icon: DollarSign, label: 'Revenue', value: `$${metrics?.revenue?.toLocaleString() || 0}`, change: '+8%' },
          { icon: Calendar, label: 'Events', value: metrics?.events || 0, change: '+15%' },
          { icon: TrendingUp, label: 'Growth', value: `${metrics?.growth || 0}%`, change: '+5%' },
        ].map((metric, index) => {
          const Icon = metric.icon
          return (
            <LiquidGlass key={index} intensity="light">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold">{metric.change}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
              </div>
            </LiquidGlass>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Growth</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {[65, 72, 68, 80, 85, 90, 95].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex-1 bg-gradient-to-t from-primary-600 to-secondary-600 rounded-t-lg"
                />
              ))}
            </div>
          </div>
        </LiquidGlass>

        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Revenue Trends</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {[50, 60, 55, 70, 75, 80, 85].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg"
                />
              ))}
            </div>
          </div>
        </LiquidGlass>
      </div>
    </div>
  )
}

