'use client'

/**
 * Toast Notification Component
 * 
 * Displays temporary success/error/info messages to the user.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  }

  const colors = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-blue-500 dark:bg-blue-600',
  }

  const Icon = icons[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`${colors[toast.type]} text-white rounded-lg shadow-lg p-4 mb-2 flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    // Listen for toast events
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...event.detail,
        id: `toast_${Date.now()}_${Math.random()}`,
      }
      setToasts((prev) => [...prev, toast])
    }

    window.addEventListener('showToast', handleToast as EventListener)

    return () => {
      window.removeEventListener('showToast', handleToast as EventListener)
    }
  }, [])

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={handleClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Helper function to show toast
export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  const event = new CustomEvent('showToast', {
    detail: { message, type, duration },
  })
  window.dispatchEvent(event)
}

