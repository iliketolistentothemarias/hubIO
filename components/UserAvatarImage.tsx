'use client'

import { useState } from 'react'

type Props = {
  src?: string | null
  name: string
  /** Tailwind size classes, e.g. w-12 h-12 */
  className?: string
  textClassName?: string
  gradientClassName?: string
}

/**
 * Rounds avatar with gradient initial fallback; on load error hides broken/placeholder URLs.
 */
export default function UserAvatarImage({
  src,
  name,
  className = 'h-12 w-12',
  textClassName = 'text-lg',
  gradientClassName = 'bg-gradient-to-br from-[#D4A574] to-[#8B6F47]',
}: Props) {
  const [failed, setFailed] = useState(false)
  const initial = (name?.trim()?.[0] || '?').toUpperCase()
  const url = typeof src === 'string' ? src.trim() : ''

  if (!url || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${gradientClassName} ${className} ${textClassName}`}
        aria-hidden
      >
        {initial}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt=""
      className={`shrink-0 rounded-full object-cover ${className}`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
