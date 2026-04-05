'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, Calendar, Target, FileText, Award, TrendingUp, 
  CheckCircle, Building2, Users, GraduationCap, X, Send
} from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { mockGrants, type Grant } from '@/data/mockGrants'

interface GrantApplication {
  id: string
  grantId: string
  grantTitle: string
  grantOrganization: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  organization: string
  reason: string
  projectDescription: string
  submittedAt: string
}

const categories = ['All', 'Business', 'Community', 'Education', 'Non-Profit', 'Arts', 'Technology']

export default function GrantsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'closing-soon'>('all')
  const [applyGrant, setApplyGrant] = useState<Grant | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [communityGrants, setCommunityGrants] = useState<Grant[]>([])
  const [removedDefaultIds, setRemovedDefaultIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('approvedGrants') || '[]')
      const mapped: Grant[] = stored.map((g: any) => ({
        id: g.id,
        title: g.title,
        organization: g.organization,
        description: g.description,
        category: g.category,
        amount: g.amount,
        eligibility: g.eligibility ? g.eligibility.split(',').map((s: string) => s.trim()) : [],
        requirements: g.requirements ? g.requirements.split(',').map((s: string) => s.trim()) : [],
        status: 'open' as const,
        applications: 0,
        verified: false,
      }))
      setCommunityGrants(mapped)
      const removed = JSON.parse(localStorage.getItem('removedDefaultGrantIds') || '[]') as string[]
      setRemovedDefaultIds(new Set(removed))
    } catch { /* ignore */ }
  }, [])

  const visibleMockGrants = useMemo(
    () => mockGrants.filter(g => !removedDefaultIds.has(g.id)),
    [removedDefaultIds]
  )

  const allGrants = useMemo(
    () => [...visibleMockGrants, ...communityGrants],
    [visibleMockGrants, communityGrants]
  )

  const [form, setForm] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    organization: '',
    reason: '',
    projectDescription: '',
  })

  const filteredGrants = useMemo(() => {
    let filtered = allGrants

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(g => g.category === selectedCategory)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(g => g.status === selectedStatus)
    }

    return filtered
  }, [allGrants, selectedCategory, selectedStatus])

  const tabs = [
    { id: 'all', label: 'All Grants', icon: FileText, count: filteredGrants.length },
    { id: 'business', label: 'Business', icon: Building2, count: filteredGrants.filter(g => g.category === 'Business').length },
    { id: 'community', label: 'Community', icon: Users, count: filteredGrants.filter(g => g.category === 'Community').length },
    { id: 'education', label: 'Education', icon: GraduationCap, count: filteredGrants.filter(g => g.category === 'Education').length },
  ]

  const openApply = (grant: Grant) => {
    setApplyGrant(grant)
    setSubmitted(false)
    setForm({ applicantName: '', applicantEmail: '', applicantPhone: '', organization: '', reason: '', projectDescription: '' })
  }

  const closeApply = () => {
    setApplyGrant(null)
    setSubmitted(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applyGrant) return
    setSubmitting(true)

    // Save to localStorage so the admin dashboard can read it
    const application: GrantApplication = {
      id: `app-${Date.now()}`,
      grantId: applyGrant.id,
      grantTitle: applyGrant.title,
      grantOrganization: applyGrant.organization,
      ...form,
      submittedAt: new Date().toISOString(),
    }

    try {
      const existing: GrantApplication[] = JSON.parse(localStorage.getItem('grantApplications') || '[]')
      existing.push(application)
      localStorage.setItem('grantApplications', JSON.stringify(existing))
    } catch {
      // ignore storage errors
    }

    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/10 pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Grant Opportunities
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover funding opportunities for your business, project, or education. Find grants that match your needs.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <LiquidGlass intensity="light">
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                          : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:shadow-lg'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {['all', 'open', 'closing-soon'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status as any)}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        selectedStatus === status
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                          : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:shadow-lg'
                      }`}
                    >
                      {status === 'all' ? 'All Status' : status === 'open' ? 'Open' : 'Closing Soon'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} defaultTab="all">
          {(activeTab) => {
            let displayGrants = filteredGrants
            if (activeTab !== 'all') {
              displayGrants = displayGrants.filter(g => g.category.toLowerCase() === activeTab)
            }

            return (
              <div className="grid md:grid-cols-2 gap-6">
                {displayGrants.map((grant, index) => (
                  <motion.div
                    key={grant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <LiquidGlass intensity="medium">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{grant.title}</h3>
                              {grant.verified && (
                                <div title="Verified Grant">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{grant.organization}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            grant.status === 'open' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : grant.status === 'closing-soon'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {grant.status === 'closing-soon' ? 'Closing Soon' : grant.status}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">{grant.amount}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">available</span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{grant.description}</p>

                        {/* Deadline row — now always "No Deadline" */}
                        <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                          <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">No Deadline</span>
                        </div>

                        {/* Eligibility */}
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary-600" />
                            Eligibility
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {grant.eligibility.map((item, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span>{grant.applications} applications</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Award className="w-4 h-4" />
                            <span>{grant.category}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => openApply(grant)}
                          className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Apply Now
                        </button>
                      </div>
                    </LiquidGlass>
                  </motion.div>
                ))}
              </div>
            )
          }}
        </TabNavigation>
      </div>

      {/* Apply Now Modal */}
      <AnimatePresence>
        {applyGrant && (
          <>
            <motion.div
              key="grant-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeApply}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60000]"
            />
            <motion.div
              key="grant-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[60001] flex items-center justify-center p-4"
              onClick={closeApply}
            >
              <div
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold mb-1">Grant Application</p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{applyGrant.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{applyGrant.organization}</p>
                  </div>
                  <button
                    onClick={closeApply}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8 space-y-4"
                    >
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Application Submitted!</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        Your application for <strong>{applyGrant.title}</strong> has been submitted successfully.
                        You can view its status in the admin dashboard.
                      </p>
                      <button
                        onClick={closeApply}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
                      >
                        Done
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={form.applicantName}
                            onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))}
                            placeholder="Jane Smith"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                          <input
                            type="email"
                            required
                            value={form.applicantEmail}
                            onChange={e => setForm(f => ({ ...f, applicantEmail: e.target.value }))}
                            placeholder="jane@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={form.applicantPhone}
                            onChange={e => setForm(f => ({ ...f, applicantPhone: e.target.value }))}
                            placeholder="(555) 000-0000"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization / School</label>
                          <input
                            type="text"
                            value={form.organization}
                            onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                            placeholder="My Business LLC"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Why are you applying? *</label>
                        <textarea
                          required
                          rows={3}
                          value={form.reason}
                          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                          placeholder="Briefly explain why you are applying for this grant and how it would benefit you or your community..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project / Use Description *</label>
                        <textarea
                          required
                          rows={3}
                          value={form.projectDescription}
                          onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
                          placeholder="Describe your project, how you plan to use the funds, and the expected impact..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                        />
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                        <strong>Requirements for this grant:</strong>{' '}
                        {applyGrant.requirements.join(' · ')}
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Application
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
