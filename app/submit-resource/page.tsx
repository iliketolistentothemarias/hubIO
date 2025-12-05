'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, Building, MapPin, Phone, Mail, Globe, Tag, Clock } from 'lucide-react'
import AuthRequired from '@/components/auth/AuthRequired'

function SubmitResourceForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'healthcare',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tags: '',
    hours: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t)
      
      const res = await fetch('/api/resources/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert(data.message || 'Resource submitted successfully! It will be reviewed by our admins.')
        router.push('/directory')
      } else {
        alert(data.error || 'Failed to submit resource')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit resource')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8 pt-24">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Submit a Resource</h1>
          <p className="text-gray-300">
            Help grow our community by adding a local resource or service
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Building className="inline mr-2" size={16} />
              Resource Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., South Fayette Community Center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="social_services">Social Services</option>
              <option value="business">Business</option>
              <option value="recreation">Recreation</option>
              <option value="government">Government</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="emergency">Emergency Services</option>
              <option value="transportation">Transportation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe what this resource offers..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="inline mr-2" size={16} />
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="123 Main St, Pittsburgh, PA 15241"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="inline mr-2" size={16} />
              Hours / Availability (optional)
            </label>
            <input
              type="text"
              name="hours"
              value={formData.hours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm or Opens quarterly on the 1st"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="inline mr-2" size={16} />
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="(412) 555-0100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="inline mr-2" size={16} />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="inline mr-2" size={16} />
              Website (optional)
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Tag className="inline mr-2" size={16} />
              Tags (comma-separated, optional)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., senior care, community center, free services"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send size={20} />
                  Submit Resource
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/directory')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Your submission will be reviewed by our admin team before being published.
          </p>
        </motion.form>
      </div>
    </div>
  )
}

export default function SubmitResourcePage() {
  return (
    <AuthRequired
      featureName="resource submissions"
      description="Submitting official resources is limited to verified members. Create an account to share organizations with the community."
    >
      <SubmitResourceForm />
    </AuthRequired>
  )
}