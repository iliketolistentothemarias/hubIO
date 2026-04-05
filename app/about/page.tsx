'use client'

import { motion } from 'framer-motion'
import { Heart, Users, Target, Sparkles, Shield, Globe, ArrowRight, Award, Handshake, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0A0F] pt-20 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="section-padding bg-white dark:bg-[#0B0A0F]">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-6">
              About Communify
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/70 leading-relaxed">
              Connecting communities with resources, support, and opportunities for growth.
              We believe in building stronger communities by making resources accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding border-t border-gray-200 dark:border-[#2c2c3e]">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-4">
                <Target className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
                  <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed mb-4">
                Communify exists to bridge the gap between community members and the resources they need.
                We provide a centralized platform where individuals and families can easily discover and
                access essential services, support organizations, and community programs.
              </p>
                  <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
                Our mission is to empower communities by ensuring that every resident has access to the
                information and resources necessary to thrive, regardless of their background or circumstances.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-96 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 
                         dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center 
                         overflow-hidden shadow-2xl"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="absolute inset-0 bg-gradient-to-br from-primary-200/50 to-secondary-200/50 
                           dark:from-primary-800/30 dark:to-secondary-800/30"
              />
              <Heart className="w-32 h-32 text-primary-600 dark:text-primary-400 relative z-10 opacity-20" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Community First',
                description: 'We prioritize the needs of our community, ensuring every resident has access to vital resources and support services.',
                bgColor: 'bg-primary-100',
                iconColor: 'text-primary-600',
              },
              {
                icon: Users,
                title: 'Inclusivity',
                description: 'We believe in serving everyone, regardless of background, ensuring equitable access to resources for all community members.',
                bgColor: 'bg-secondary-100',
                iconColor: 'text-secondary-600',
              },
              {
                icon: Shield,
                title: 'Trust & Transparency',
                description: 'We maintain the highest standards of accuracy and transparency in the information we provide, building trust with our community.',
                bgColor: 'bg-primary-100',
                iconColor: 'text-primary-600',
              },
              {
                icon: Sparkles,
                title: 'Innovation',
                description: 'We continuously evolve our platform to better serve the community, embracing new technologies and approaches.',
                bgColor: 'bg-secondary-100',
                iconColor: 'text-secondary-600',
              },
              {
                icon: Handshake,
                title: 'Collaboration',
                description: 'We work closely with organizations, service providers, and community members to build a comprehensive resource network.',
                bgColor: 'bg-primary-100',
                iconColor: 'text-primary-600',
              },
              {
                icon: Lightbulb,
                title: 'Empowerment',
                description: 'We empower individuals and families by providing the information and tools they need to make informed decisions.',
                bgColor: 'bg-secondary-100',
                iconColor: 'text-secondary-600',
              },
            ].map((value, index) => {
              const Icon = value.icon
              return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-[#1f1b28]/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 text-center border border-gray-200 dark:border-[#2c2c3e] hover:scale-105 transition-transform duration-300"
                  style={{
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  }}
                >
                  <div className={`inline-block p-4 rounded-full ${value.bgColor} dark:bg-[#2c2c3e] mb-4`}>
                    <Icon className={`w-8 h-8 ${value.iconColor} dark:text-[#E8D7B9]`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Communify makes it easy to find and access community resources in three simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Explore',
                description: 'Browse our comprehensive directory of community resources, services, and organizations. Use search and filters to find exactly what you need.',
                icon: Globe,
              },
              {
                step: '02',
                title: 'Discover',
                description: 'Learn about featured resources, read detailed descriptions, and access contact information for organizations that can help.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Connect',
                description: 'Reach out to organizations directly, submit new resources, and help grow our community resource network.',
                icon: Handshake,
              },
            ].map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 
                                  border border-white/30 dark:border-gray-700/30 h-full"
                        style={{
                          backdropFilter: 'saturate(180%) blur(20px)',
                          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                        }}
                  >
                    <div className="text-6xl font-bold text-primary-100 dark:text-primary-900/30 mb-4">{step.step}</div>
                    <Icon className="w-12 h-12 text-primary-600 dark:text-primary-400 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-secondary-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Together, we're building a stronger, more connected community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: '250+', label: 'Resources Listed' },
              { value: '50+', label: 'Organizations' },
              { value: '10K+', label: 'Monthly Visitors' },
              { value: '100%', label: 'Free Access' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Award className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Help us grow our resource hub! Submit a new resource, share feedback, or get involved
              in building a stronger community together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
                >
                  Submit a Resource
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/directory">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Explore Directory
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

