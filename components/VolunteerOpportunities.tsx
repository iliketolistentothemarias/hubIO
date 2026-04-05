'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HandHeart, Calendar, MapPin, Users, Clock, ArrowRight, Filter } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface Opportunity {
  id: string
  title: string
  organization: string
  description: string
  date: string
  time: string
  location: string
  volunteersNeeded: number
  volunteersSignedUp: number
  category: string
  skills?: string[]
}

const opportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Community Garden Cleanup',
    organization: 'Green Spaces Initiative',
    description: 'Help us prepare the community garden for spring planting. Tasks include weeding, soil preparation, and organizing tools.',
    date: '2026-02-15',
    time: '9:00 AM - 12:00 PM',
    location: 'Community Garden, Main Street',
    volunteersNeeded: 20,
    volunteersSignedUp: 12,
    category: 'Environment',
    skills: ['Gardening', 'Physical Activity'],
  },
  {
    id: '2',
    title: 'Food Bank Distribution',
    organization: 'Community Food Bank',
    description: 'Assist with food distribution to families in need. Help with setup, distribution, and cleanup.',
    date: '2026-02-20',
    time: '8:00 AM - 2:00 PM',
    location: '123 Main Street',
    volunteersNeeded: 15,
    volunteersSignedUp: 8,
    category: 'Food Assistance',
    skills: ['Customer Service', 'Organization'],
  },
  {
    id: '3',
    title: 'Youth Mentoring Program',
    organization: 'Youth Empowerment Center',
    description: 'Mentor local youth in academic and life skills. Training provided. Commitment: 2 hours/week for 3 months.',
    date: '2026-02-25',
    time: '3:00 PM - 5:00 PM',
    location: '789 Elm Street',
    volunteersNeeded: 10,
    volunteersSignedUp: 6,
    category: 'Youth Services',
    skills: ['Mentoring', 'Education'],
  },
  {
    id: '4',
    title: 'Senior Center Tech Help',
    organization: 'Senior Care Network',
    description: 'Help seniors learn to use smartphones, tablets, and computers. Patient and friendly volunteers needed.',
    date: '2026-02-18',
    time: '10:00 AM - 12:00 PM',
    location: '654 Maple Drive',
    volunteersNeeded: 8,
    volunteersSignedUp: 5,
    category: 'Senior Services',
    skills: ['Technology', 'Patience'],
  },
]

const categories = ['All', 'Environment', 'Food Assistance', 'Youth Services', 'Senior Services', 'Community']

export default function VolunteerOpportunities() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredOpportunities = selectedCategory === 'All'
    ? opportunities
    : opportunities.filter(opp => opp.category === selectedCategory)

  const getProgress = (signedUp: number, needed: number) => Math.min((signedUp / needed) * 100, 100)

  return (
    <section className="section-padding bg-gradient-to-br from-primary-50/50 via-white to-secondary-50/50 
                        dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/10">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <HandHeart className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Volunteer Opportunities
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Make a difference in your community. Find volunteer opportunities that match your interests and schedule.
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

        {/* Opportunities Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredOpportunities.map((opportunity, index) => {
            const progress = getProgress(opportunity.volunteersSignedUp, opportunity.volunteersNeeded)
            const spotsLeft = opportunity.volunteersNeeded - opportunity.volunteersSignedUp
            return (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <LiquidGlass intensity="medium">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 
                                     dark:text-primary-300 text-sm font-medium rounded-full">
                        {opportunity.category}
                      </span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {spotsLeft}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Spots Left</div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {opportunity.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {opportunity.organization}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                      {opportunity.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span>{new Date(opportunity.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span>{opportunity.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span>{opportunity.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span>{opportunity.volunteersSignedUp} of {opportunity.volunteersNeeded} volunteers</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    {opportunity.skills && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl 
                               font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                               transition-all duration-200"
                    >
                      <HandHeart className="w-5 h-5" />
                      Sign Up to Volunteer
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
            Post Volunteer Opportunity
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

