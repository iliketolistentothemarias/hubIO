'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle, DollarSign, Mail, ChevronLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import AuthRequired from '@/components/auth/AuthRequired'

const GRANT_CATEGORIES = ['Business', 'Community', 'Education', 'Non-Profit', 'Arts', 'Technology', 'Health', 'Other']

function GrantSubmitContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({
    title: '',
    organization: '',
    category: '',
    description: '',
    amount: '',
    eligibility: '',
    requirements: '',
    contactName: '',
    contactEmail: '',
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
    if (!form.title.trim()) e.title = 'Grant title is required'
    if (!form.organization.trim()) e.organization = 'Organization name is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.amount.trim()) e.amount = 'Grant amount is required'
    if (!form.eligibility.trim()) e.eligibility = 'Eligibility criteria is required'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)

    const submission = {
      id: `gl-${Date.now()}`,
      ...form,
      submittedAt: new Date().toISOString(),
    }

    try {
      const existing = JSON.parse(localStorage.getItem('grantListingSubmissions') || '[]')
      existing.push(submission)
      localStorage.setItem('grantListingSubmissions', JSON.stringify(existing))
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
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Grant Submitted!</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>{form.title}</strong> has been submitted for admin review and will appear in the Grants directory once approved.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/grants" className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all">
              View Grants
            </Link>
            <button
              onClick={() => { setSubmitted(false); setForm({ title: '', organization: '', category: '', description: '', amount: '', eligibility: '', requirements: '', contactName: '', contactEmail: '' }) }}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Submit a Grant</h1>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Know of a funding opportunity? Submit it for the community to see. Admin will review before it goes live.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className={`rounded-3xl p-8 space-y-6 ${isDark ? 'bg-[#1F1B26]/70 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'}`}
        >
          {/* Title + Organization */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Grant Title *</label>
              <input
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })) }}
                placeholder="Small Business Startup Grant"
                className={`${inputClass} ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>
            <div>
              <label className={labelClass}>Organization *</label>
              <input
                value={form.organization}
                onChange={e => { setForm(f => ({ ...f, organization: e.target.value })); setErrors(er => ({ ...er, organization: '' })) }}
                placeholder="Local Economic Foundation"
                className={`${inputClass} ${errors.organization ? 'border-red-500' : ''}`}
              />
              {errors.organization && <p className="mt-1 text-xs text-red-500">{errors.organization}</p>}
            </div>
          </div>

          {/* Category + Amount */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={form.category}
                onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: '' })) }}
                className={`${inputClass} ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select category...</option>
                {GRANT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>
            <div>
              <label className={labelClass}><DollarSign className="inline w-4 h-4 mr-1" />Grant Amount *</label>
              <input
                value={form.amount}
                onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErrors(er => ({ ...er, amount: '' })) }}
                placeholder="Up to $25,000"
                className={`${inputClass} ${errors.amount ? 'border-red-500' : ''}`}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: '' })) }}
              placeholder="Describe this grant opportunity and its purpose..."
              className={`${inputClass} resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Eligibility */}
          <div>
            <label className={labelClass}>Eligibility Criteria *</label>
            <textarea
              rows={2}
              value={form.eligibility}
              onChange={e => { setForm(f => ({ ...f, eligibility: e.target.value })); setErrors(er => ({ ...er, eligibility: '' })) }}
              placeholder="Who can apply? e.g. Small businesses, non-profits, local residents..."
              className={`${inputClass} resize-none ${errors.eligibility ? 'border-red-500' : ''}`}
            />
            {errors.eligibility && <p className="mt-1 text-xs text-red-500">{errors.eligibility}</p>}
          </div>

          {/* Requirements */}
          <div>
            <label className={labelClass}><FileText className="inline w-4 h-4 mr-1" />Application Requirements</label>
            <textarea
              rows={2}
              value={form.requirements}
              onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
              placeholder="What do applicants need to submit? e.g. Business plan, budget, essay..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Contact */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Your Name</label>
              <input
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><Mail className="inline w-4 h-4 mr-1" />Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                placeholder="grants@foundation.org"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><Send className="w-4 h-4" /> Submit Grant</>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  )
}

export default function SubmitGrantPage() {
  return (
    <AuthRequired featureName="grant submission" description="Sign in to submit a grant opportunity for the community.">
      <GrantSubmitContent />
    </AuthRequired>
  )
}
