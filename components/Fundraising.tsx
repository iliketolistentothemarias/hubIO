'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, Target, Heart, ArrowRight, Sparkles } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface FundraisingCampaign {
  id: string
  title: string
  description: string
  goal: number
  raised: number
  donors: number
  daysLeft: number
  category: string
  image?: string
}

const campaigns: FundraisingCampaign[] = [
  {
    id: '1',
    title: 'Community Food Bank Expansion',
    description: 'Help us expand our food bank to serve 500+ more families monthly. Your donation provides nutritious meals to those in need.',
    goal: 50000,
    raised: 32500,
    donors: 234,
    daysLeft: 15,
    category: 'Food Security',
  },
  {
    id: '2',
    title: 'Local Bookstore Revival',
    description: 'Support our beloved local bookstore that\'s been serving the community for 30 years. Help us stay open and expand our children\'s section.',
    goal: 25000,
    raised: 18200,
    donors: 156,
    daysLeft: 22,
    category: 'Small Business',
  },
  {
    id: '3',
    title: 'Youth Center Renovation',
    description: 'Renovate our community youth center with new equipment, study spaces, and recreational facilities for local teens.',
    goal: 75000,
    raised: 45600,
    donors: 312,
    daysLeft: 8,
    category: 'Youth Services',
  },
  {
    id: '4',
    title: 'Local Coffee Shop Equipment',
    description: 'Help a new local coffee shop get the equipment they need to open and create jobs in our community.',
    goal: 15000,
    raised: 8900,
    donors: 89,
    daysLeft: 30,
    category: 'Small Business',
  },
]

export default function Fundraising() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = ['All', 'Small Business', 'Food Security', 'Youth Services', 'Community']

  const filteredCampaigns = selectedCategory === 'All'
    ? campaigns
    : campaigns.filter(c => c.category === selectedCategory)

  const getProgress = (raised: number, goal: number) => Math.min((raised / goal) * 100, 100)

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 via-white to-primary-50/30 
                        dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/20 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-secondary-400/20 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="inline-block mb-4"
          >
            <DollarSign className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Community Fundraising
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Support local businesses, community projects, and initiatives that make our neighborhood stronger.
            Every contribution helps build a better community.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 border border-white/30 dark:border-gray-700/30 hover:shadow-lg'
              }`}
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Campaigns Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign, index) => {
            const progress = getProgress(campaign.raised, campaign.goal)
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <LiquidGlass intensity="medium">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                        {campaign.category}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-medium">Featured</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${campaign.raised.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              of ${campaign.goal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                            {progress.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{campaign.donors}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Donors</div>
                      </div>
                      <div className="text-center">
                        <Target className="w-5 h-5 text-secondary-600 dark:text-secondary-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{campaign.daysLeft}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Days Left</div>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ${((campaign.goal - campaign.raised) / campaign.daysLeft).toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Daily Need</div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl 
                               font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                               transition-all duration-200"
                    >
                      <Heart className="w-5 h-5" />
                      Donate Now
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </LiquidGlass>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl 
                     text-gray-900 dark:text-white font-semibold border border-white/30 dark:border-gray-700/30
                     shadow-lg hover:shadow-xl transition-all duration-200"
            style={{
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
          >
            Start Your Own Campaign
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

