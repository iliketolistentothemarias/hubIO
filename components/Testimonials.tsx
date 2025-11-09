'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  image?: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Community Member',
    content: 'HubIO has been a lifesaver for finding local resources. The search is so easy to use and I found exactly what I needed for my family.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Social Worker',
    content: 'As a professional, I recommend HubIO to all my clients. It\'s comprehensive, up-to-date, and makes connecting people with resources so much easier.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Maria Rodriguez',
    role: 'Non-Profit Director',
    content: 'Having our organization listed on HubIO has increased our visibility significantly. We\'ve seen a 40% increase in inquiries since joining.',
    rating: 5,
  },
  {
    id: '4',
    name: 'David Thompson',
    role: 'Community Volunteer',
    content: 'The interactive map feature is amazing! I can easily find resources near me and see what\'s available in different neighborhoods.',
    rating: 5,
  },
  {
    id: '5',
    name: 'Emily Watson',
    role: 'Student',
    content: 'I used HubIO to find tutoring services and after-school programs. The detailed information and ratings helped me make the best choice.',
    rating: 5,
  },
  {
    id: '6',
    name: 'James Wilson',
    role: 'Senior Citizen',
    content: 'The senior services section is fantastic. I found meal delivery, transportation, and social activities all in one place. Very user-friendly!',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            What People Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Hear from community members, professionals, and organizations who use HubIO.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl 
                         border border-white/30 dark:border-gray-700/30 hover:shadow-2xl transition-all duration-300"
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
              <Quote className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-4 opacity-50" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

