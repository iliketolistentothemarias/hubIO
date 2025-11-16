'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, Globe, RefreshCw, LogOut } from 'lucide-react'

interface Resource {
  id: string
  name: string
  category: string
  description: string
  address: string
  phone: string
  email: string
  website?: string
  tags?: string[]
  status: string
  created_at: string
  submitter_name?: string
  submitter_email?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pendingResources, setPendingResources] = useState<Resource[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()

      if (!data.success || (data.data.user.role !== 'admin' && data.data.user.role !== 'moderator')) {
        router.push('/')
        return
      }

      setUser(data.data.user)
      await fetchPendingResources()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingResources = async () => {
    try {
      const res = await fetch('/api/admin/resources/pending')
      const data = await res.json()

      if (data.success) {
        setPendingResources(data.data.resources)
      }
    } catch (error) {
      console.error('Failed to fetch pending resources:', error)
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/resources/${id}/approve`, {
        method: 'PATCH',
      })
      const data = await res.json()

      if (data.success) {
        setPendingResources(prev => prev.filter(r => r.id !== id))
        alert('Resource approved successfully!')
      } else {
        alert(data.error || 'Failed to approve resource')
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve resource')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/resources/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()

      if (data.success) {
        setPendingResources(prev => prev.filter(r => r.id !== id))
        alert('Resource rejected')
      } else {
        alert(data.error || 'Failed to reject resource')
      }
    } catch (error) {
      console.error('Reject error:', error)
      alert('Failed to reject resource')
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">
              Welcome back, {user?.name} ({user?.role})
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchPendingResources}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </motion.div>

        <div className="grid gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-yellow-400" size={24} />
              <h2 className="text-2xl font-bold text-white">
                Pending Resources ({pendingResources.length})
              </h2>
            </div>
            <p className="text-gray-300">Resources waiting for your review</p>
          </motion.div>
        </div>

        {pendingResources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20"
          >
            <CheckCircle className="mx-auto text-green-400 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">All caught up!</h3>
            <p className="text-gray-300">No pending resources to review</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {pendingResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{resource.name}</h3>
                    <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm">
                      {resource.category}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(resource.id)}
                      disabled={actionLoading === resource.id}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={20} />
                      {actionLoading === resource.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(resource.id)}
                      disabled={actionLoading === resource.id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={20} />
                      Reject
                    </button>
                  </div>
                </div>

                <p className="text-gray-300 mb-4">{resource.description}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2 text-gray-300">
                    <MapPin size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{resource.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone size={20} className="text-purple-400 flex-shrink-0" />
                    <span>{resource.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail size={20} className="text-purple-400 flex-shrink-0" />
                    <span>{resource.email}</span>
                  </div>
                  {resource.website && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Globe size={20} className="text-purple-400 flex-shrink-0" />
                      <a
                        href={resource.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        {resource.website}
                      </a>
                    </div>
                  )}
                </div>

                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resource.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User size={16} />
                    <span>
                      Submitted by: {resource.submitter_name || 'Unknown'} ({resource.submitter_email || 'N/A'})
                    </span>
                    <span className="ml-4">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
