'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle, Store, Globe, Phone, Mail, MapPin, Clock, Tag, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import AuthRequired from '@/components/auth/AuthRequired'

const BIZ_CATEGORIES = [
  'Food & Beverage', 'Retail', 'Services', 'Professional', 'Entertainment',
  'Health & Beauty', 'Technology', 'Education', 'Non-Profit', 'Other',
]

function BusinessSubmitContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({
    businessName: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    hours: '',
    contactName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const inputClass = `w-full px-4 py-3 rounded-2xl border-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
    isDark
      ? 'bg-[#0B0A17] border-[#2c2c3e] text-white placeholder:text-gray-500'
      : 'bg-white/90 border-gray-200/60 text-gray-900 placeholder:text-gray-400'
  }`
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.businessName.trim()) e.businessName = 'Business name is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.website.trim()) e.website = 'Website URL is required'
    else {
      try { new URL(form.website) } catch { e.website = 'Must be a valid URL (e.g. https://example.com)' }
    }
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)

    const submission = {
      id: `biz-${Date.now()}`,
      ...form,
      submittedAt: new Date().toISOString(),
    }

    try {
      const existing = JSON.parse(localStorage.getItem('businessSubmissions') || '[]')
      existing.push(submission)
      localStorage.setItem('businessSubmissions', JSON.stringify(existing))
    } catch { /* ignore */ }

    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={`min-h-screen pt-24 pb-16 flex items-center justify-center ${isDark ? 'bg-[#1C1B18]' : 'bg-[#FAF9F6]'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-4 space-y-4"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Business Submitted!</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your business listing for <strong>{form.businessName}</strong> has been submitted for admin review.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/business" className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all">
              View Directory
            </Link>
            <button
              onClick={() => { setSubmitted(false); setForm({ businessName: '', category: '', description: '', address: '', phone: '', email: '', website: '', hours: '', contactName: '' }) }}
              className={`px-5 py-2.5 rounded-2xl font-semibold border ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}
            >
              Submit Another
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen pt-24 pb-16 ${isDark ? 'bg-[#1C1B18]' : 'bg-[#FAF9F6]'}`}>
      <div className="container-custom max-w-2xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/submit" className={`inline-flex items-center gap-1 text-sm mb-4 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
            <ChevronLeft className="w-4 h-4" /> Back to Submit
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Submit a Business</h1>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            List your business in the community directory. Submissions are reviewed by an admin before going live.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className={`rounded-3xl p-8 space-y-6 ${isDark ? 'bg-[#1F1B26]/70 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'}`}
        >
          {/* Business Name + Category */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Business Name *</label>
              <input
                value={form.businessName}
                onChange={e => { setForm(f => ({ ...f, businessName: e.target.value })); setErrors(er => ({ ...er, businessName: '' })) }}
                placeholder="Downtown Coffee Co."
                className={`${inputClass} ${errors.businessName ? 'border-red-500' : ''}`}
              />
              {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>}
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={form.category}
                onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: '' })) }}
                className={`${inputClass} ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select category...</option>
                {BIZ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: '' })) }}
              placeholder="Tell the community about your business..."
              className={`${inputClass} resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Website (required) */}
          <div>
            <label className={labelClass}><Globe className="inline w-4 h-4 mr-1" />Website URL *</label>
            <input
              type="url"
              value={form.website}
              onChange={e => { setForm(f => ({ ...f, website: e.target.value })); setErrors(er => ({ ...er, website: '' })) }}
              placeholder="https://yourbusiness.com"
              className={`${inputClass} ${errors.website ? 'border-red-500' : ''}`}
            />
            {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website}</p>}
          </div>

          {/* Address + Phone */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><MapPin className="inline w-4 h-4 mr-1" />Address</label>
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 Main Street, City"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><Phone className="inline w-4 h-4 mr-1" />Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                className={inputClass}
              />
            </div>
          </div>

          {/* Email + Hours */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Mail className="inline w-4 h-4 mr-1" />Business Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="info@yourbusiness.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><Clock className="inline w-4 h-4 mr-1" />Business Hours</label>
              <input
                value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                placeholder="Mon-Fri: 9am-5pm"
                className={inputClass}
              />
            </div>
          </div>

          {/* Contact Name */}
          <div>
            <label className={labelClass}>Your Name (Contact Person)</label>
            <input
              value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              placeholder="Jane Smith"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><Send className="w-4 h-4" /> Submit Business</>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  )
}

export default function SubmitBusinessPage() {
  return (
    <AuthRequired featureName="business submission" description="Sign in to submit your business to the community directory.">
      <BusinessSubmitContent />
    </AuthRequired>
  )
}
