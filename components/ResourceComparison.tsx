'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitCompare, Check, XCircle, BarChart3 } from 'lucide-react'
import { Resource } from '@/lib/types'
import { resources } from '@/data/resources'

interface ResourceComparisonProps {
  selectedIds: string[]
  onClose: () => void
  onRemove: (id: string) => void
}

export default function ResourceComparison({ selectedIds, onClose, onRemove }: ResourceComparisonProps) {
  const selectedResources = resources.filter((r) => selectedIds.includes(r.id))

  const comparisonFields = [
    { label: 'Name', field: 'name' },
    { label: 'Category', field: 'category' },
    { label: 'Rating', field: 'rating' },
    { label: 'Reviews', field: 'reviewCount' },
    { label: 'Hours', field: 'hours' },
    { label: 'Capacity', field: 'capacity' },
    { label: 'Languages', field: 'languages' },
    { label: 'Accessibility', field: 'accessibility' },
  ]

  const getFieldValue = (resource: Resource, field: string) => {
    const value = resource[field as keyof Resource]
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return value || 'N/A'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl 
                     max-w-6xl w-full max-h-[90vh] overflow-hidden border border-white/30 dark:border-gray-700/30"
          style={{
            backdropFilter: 'saturate(180%) blur(40px)',
            WebkitBackdropFilter: 'saturate(180%) blur(40px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Resources</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Feature</th>
                  {selectedResources.map((resource) => (
                    <th key={resource.id} className="text-left py-3 px-4 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">{resource.name}</span>
                        <button
                          onClick={() => onRemove(resource.id)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFields.map((field, index) => (
                  <tr
                    key={field.field}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {field.label}
                    </td>
                    {selectedResources.map((resource) => {
                      const value = getFieldValue(resource, field.field)
                      const isBetter = field.field === 'rating' && typeof value === 'number' && value > 4.5
                      return (
                        <td key={resource.id} className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            {isBetter && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                            <span>{String(value)}</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="bg-primary-50/50 dark:bg-primary-900/20">
                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Description</td>
                  {selectedResources.map((resource) => (
                    <td key={resource.id} className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {resource.description}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Services</td>
                  {selectedResources.map((resource) => (
                    <td key={resource.id} className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {resource.services?.map((service) => (
                          <span
                            key={service}
                            className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded"
                          >
                            {service}
                          </span>
                        )) || 'N/A'}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tags</td>
                  {selectedResources.map((resource) => (
                    <td key={resource.id} className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {resource.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

