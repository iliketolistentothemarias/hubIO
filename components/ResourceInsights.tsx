'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, MapPin, PieChart, Award } from 'lucide-react'
import { resources } from '@/data/resources'

export default function ResourceInsights() {
  const insights = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    const totalResources = resources.length
    const featuredCount = resources.filter((r) => r.featured).length
    const withRatings = resources.filter((r) => r.rating).length
    const avgRating = resources
      .filter((r) => r.rating)
      .reduce((sum, r) => sum + (r.rating || 0), 0) / withRatings
    const totalCapacity = resources
      .filter((r) => r.capacity)
      .reduce((sum, r) => sum + (r.capacity || 0), 0)

    resources.forEach((resource) => {
      categoryCounts[resource.category] = (categoryCounts[resource.category] || 0) + 1
    })

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return {
      totalResources,
      featuredCount,
      avgRating: avgRating.toFixed(1),
      totalCapacity,
      topCategories,
      withRatings,
    }
  }, [])

  const chartData = useMemo(() => {
    const topSum = insights.topCategories.reduce((sum, [, count]) => sum + count, 0)
    const otherCount = insights.totalResources - topSum

    const data = insights.topCategories.map(([category, count]) => ({
      category,
      count,
      percentage: (count / insights.totalResources) * 100,
    }))

    if (otherCount > 0) {
      data.push({
        category: 'Other',
        count: otherCount,
        percentage: (otherCount / insights.totalResources) * 100,
      })
    }

    return data
  }, [insights])

  return (
    <div className="bg-gradient-to-br from-primary-50/80 to-secondary-50/80 dark:from-gray-800/80 dark:to-gray-900/80 
                    backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30 dark:border-gray-700/30"
      style={{
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resource Insights</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl 
                     border border-white/30 dark:border-gray-700/30
                     hover:scale-105 transition-transform duration-200"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          }}
        >
          <Users className="w-6 h-6 text-primary-600 dark:text-primary-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{insights.totalResources}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Resources</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl 
                     border border-white/30 dark:border-gray-700/30
                     hover:scale-105 transition-transform duration-200"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          }}
        >
          <Award className="w-6 h-6 text-secondary-600 dark:text-secondary-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{insights.featuredCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Featured</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl 
                     border border-white/30 dark:border-gray-700/30
                     hover:scale-105 transition-transform duration-200"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          }}
        >
          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{insights.avgRating}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl 
                     border border-white/30 dark:border-gray-700/30
                     hover:scale-105 transition-transform duration-200"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          }}
        >
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {insights.totalCapacity.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Capacity</div>
        </motion.div>
      </div>

      {/* Category Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          Category Distribution
        </h3>
        <div className="space-y-3">
          {chartData.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg 
                         border border-white/30 dark:border-gray-700/30"
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

