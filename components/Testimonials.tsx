'use client'

import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
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
    content: 'Communify has been a lifesaver for finding local resources. The search is so easy to use and I found exactly what I needed for my family.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Social Worker',
    content: 'As a professional, I recommend Communify to all my clients. It\'s comprehensive, up-to-date, and makes connecting people with resources so much easier.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Maria Rodriguez',
    role: 'Non-Profit Director',
    content: 'Having our organization listed on Communify has increased our visibility significantly. We\'ve seen a 40% increase in inquiries since joining.',
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
    content: 'I used Communify to find tutoring services and after-school programs. The detailed information and ratings helped me make the best choice.',
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
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [scrollX, setScrollX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Tripled testimonials to ensure smooth infinite scroll
  const repeatedTestimonials = [...testimonials, ...testimonials, ...testimonials]

  useEffect(() => {
    let animationFrameId: number

    const scroll = () => {
      if (isAutoScrolling && scrollRef.current) {
        setScrollX((prev) => {
          const newScrollX = prev + 0.5
          const testimonialWidth = 400 // approximate width of a testimonial card + gap
          const totalWidth = testimonials.length * testimonialWidth
          
          if (newScrollX >= totalWidth) {
            return 0
          }
          return newScrollX
        })
      }
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isAutoScrolling])

  const handleManualScroll = (direction: 'left' | 'right') => {
    setIsAutoScrolling(false)
    const testimonialWidth = 400
    if (direction === 'left') {
      setScrollX((prev) => Math.max(0, prev - testimonialWidth))
    } else {
      setScrollX((prev) => {
        const totalWidth = testimonials.length * testimonialWidth
        return (prev + testimonialWidth) % totalWidth
      })
    }
  }

  return (
    <section className="section-padding bg-[#FAF9F6] dark:bg-[#1C1B18] overflow-hidden">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-4">
            What People Say
          </h2>
          <p className="text-sm italic text-[#6B5D47] dark:text-[#B8A584] mb-2">
            Note: These are fake testimonials for the demo.
          </p>
          <p className="text-lg text-[#6B5D47] dark:text-[#B8A584] max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Hear from community members, professionals, and organizations who use Communify.
          </p>
        </motion.div>

        <div className="relative group">
          {/* Navigation Arrows */}
          <button
            onClick={() => handleManualScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 dark:bg-[#2c2c3e]/80 
                       border border-[#E8E0D6] dark:border-white/10 shadow-lg text-[#8B6F47] dark:text-[#D4A574] 
                       hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleManualScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 dark:bg-[#2c2c3e]/80 
                       border border-[#E8E0D6] dark:border-white/10 shadow-lg text-[#8B6F47] dark:text-[#D4A574] 
                       hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next review"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Scrolling Container */}
          <div 
            ref={containerRef}
            className="flex items-center"
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => !isAutoScrolling && setIsAutoScrolling(true)}
          >
            <motion.div
              ref={scrollRef}
              className="flex gap-6 py-8"
              style={{ x: -scrollX }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
              {repeatedTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className="w-[280px] md:w-[400px] flex-shrink-0 bg-white/80 dark:bg-[#1f1b28]/80 backdrop-blur-xl 
                             rounded-3xl p-6 md:p-8 shadow-xl border border-[#E8E0D6] dark:border-white/10 
                             hover:shadow-2xl transition-all duration-300"
                  style={{
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  }}
                >
                  <Quote className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574] mb-4 opacity-50" />
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
                  <p className="text-[#2C2416] dark:text-[#F5F3F0] mb-6 leading-relaxed text-lg min-h-[100px]">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B6F47] to-[#D4A574] flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">{testimonial.name}</div>
                      <div className="text-sm text-[#6B5D47] dark:text-[#B8A584]">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Manual Resume Button - Show if auto-scroll is stopped */}
        {!isAutoScrolling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-4"
          >
            <button 
              onClick={() => setIsAutoScrolling(true)}
              className="text-sm font-medium text-[#8B6F47] dark:text-[#D4A574] hover:underline flex items-center gap-2"
            >
              Resume Auto-Scroll
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

