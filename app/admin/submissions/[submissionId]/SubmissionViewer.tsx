'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface PendingSubmission {
  id: string
  name: string
  category: string
  description: string
  address: string
  phone: string
  email: string
  website: string | null
  tags: string[]
  hours: string | null
  services: string[]
  languages: string[]
  accessibility: string[]
  status: string
  created_at: string
  submitted_by: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

interface SubmissionViewerProps {
  submissionId: string
}

export default function SubmissionViewer({ submissionId }: SubmissionViewerProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const themeMode = theme === 'dark' ? 'dark' : 'light'

  const backgroundClasses = useMemo(() => {
    return themeMode === 'dark' ? 'bg-[#0F1115] text-white' : 'bg-[#FAF9F6] text-[#1C1B18]'
  }, [themeMode])

  const cardClasses = useMemo(() => {
    return themeMode === 'dark'
      ? 'bg-[#1F1B26]/70 text-white border border-white/10 shadow-lg'
      : 'bg-white/90 text-[#2C2416] border border-[#E8E0D6] shadow-xl'
  }, [themeMode])

  const [submission, setSubmission] = useState<PendingSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchSubmission = async () => {
      if (!submissionId) return
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/resource-submissions/${submissionId}`, {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Unable to load submission')
        }

        if (mounted) {
          setSubmission(payload.data.submission)
        }
      } catch (fetchError: any) {
        if (mounted) {
          console.error('Submission fetch failed', fetchError)
          setError(fetchError.message || 'Failed to load submission')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchSubmission()

    return () => {
      mounted = false
    }
  }, [submissionId])

  const accentColor = themeMode === 'dark' ? '#94f9ff' : '#8B6F47'

  return (
    <div className={`min-h-screen ${backgroundClasses} pb-10`}>
      <div className="max-w-5xl mx-auto space-y-8 px-4 pt-[6.5rem]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 transition"
          >
            <ArrowLeft size={16} />
            Back to queue
          </button>
          <div>
            <p
              className="text-xs uppercase tracking-[0.4em]"
              style={{ color: accentColor }}
            >
              Submission detail
            </p>
            <h1 className="text-3xl font-bold tracking-tight">View submitted form</h1>
          </div>
        </div>

        {loading ? (
          <div className={`${cardClasses} rounded-[30px] p-8 text-center`}>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-transparent mb-4" />
            <p className="text-lg font-semibold">Loading submission...</p>
          </div>
        ) : error ? (
          <div className={`${cardClasses} rounded-[30px] p-8 text-center`}>
            <p className="text-lg font-semibold text-red-500">{error}</p>
            <p className="text-sm opacity-80 mt-2">
              Make sure you are signed in as an admin and try again.
            </p>
          </div>
        ) : submission ? (
          <div className={`${cardClasses} rounded-[30px] p-8 space-y-8`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.4em]" style={{ color: accentColor }}>
                  Pending
                </p>
                <h2 className="text-3xl font-bold">{submission.name}</h2>
                <p className="text-sm opacity-80">{submission.category}</p>
              </div>
              <div className="text-sm text-right">
                <p>
                  <strong>Submitted</strong>
                </p>
                <p className="opacity-80">
                  {new Date(submission.created_at).toLocaleDateString()}
                </p>
                <p className="opacity-70 text-xs uppercase tracking-[0.4em]">
                  {submission.submitted_by?.role || 'Community'}
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm opacity-70">Description</p>
                  <p className="text-base leading-relaxed break-all">{submission.description}</p>
                </div>
                {submission.hours && (
                  <div>
                    <p className="text-sm opacity-70">Hours</p>
                    <p className="text-base">{submission.hours}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm opacity-70">Address</p>
                  <p className="text-base break-all">{submission.address}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm opacity-90">
                <p>
                  <strong>Contact</strong>
                  <br />
                  {submission.phone} · {submission.email}
                </p>
                {submission.website && (
                  <p>
                    <strong>Website</strong>
                    <br />
                    <a
                      href={submission.website}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {submission.website}
                    </a>
                  </p>
                )}
                <p>
                  <strong>Submitted by</strong>
                  <br />
                  {submission.submitted_by?.name || 'Community Member'}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] opacity-70">
                  {submission.submitted_by?.email || 'No email provided'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Services Offered</h3>
                {submission.services.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm">
                    {submission.services.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm opacity-70">Not provided</p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Languages & Accessibility</h3>
                {submission.languages.length > 0 ? (
                  <p className="text-sm">{submission.languages.join(', ')}</p>
                ) : (
                  <p className="text-sm opacity-70">Languages not specified</p>
                )}
                {submission.accessibility.length > 0 && (
                  <p className="text-sm mt-1">
                    Accessibility: {submission.accessibility.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {submission.tags.length > 0 && (
              <div>
                <p className="text-sm opacity-70 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {submission.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white/20 border border-white/20 text-xs uppercase tracking-[0.2em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/30 pt-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm opacity-70">Status</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Check size={18} className="text-emerald-400" />
                  {submission.status}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${cardClasses} rounded-[30px] p-8 text-center`}>
            <p className="text-lg font-semibold">Submission not found</p>
          </div>
        )}
      </div>
    </div>
  )
}

