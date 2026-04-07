'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { resourceLogoUrlCandidates } from '@/lib/utils/resource-logo'

type Props = {
  name: string
  website?: string | null
  /** Direct logo URL from DB or seed data (optional) */
  image?: string | null
  className?: string
}

/**
 * Shows organization logo from `image`, else Clearbit/Google favicon from `website`, else heart placeholder.
 */
export default function ResourceHeroLogo({ name, website, image, className = '' }: Props) {
  const urls = useMemo(() => resourceLogoUrlCandidates(image, website), [image, website])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [name, image, website])

  const src = urls[index]
  const showImage = src != null && index < urls.length

  const boxClass =
    'aspect-square w-24 h-24 md:w-40 md:h-40 mx-auto rounded-2xl md:rounded-3xl shadow-2xl relative group overflow-hidden ' +
    className

  if (!showImage) {
    return (
      <div
        className={`${boxClass} bg-gradient-to-br from-[#8B6F47] to-[#D4A574] flex items-center justify-center`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Heart className="w-10 h-10 md:w-16 md:h-16 text-white" />
      </div>
    )
  }

  return (
    <div
      className={`${boxClass} bg-white dark:bg-[#1F1B28] border border-[#E8E0D6]/80 dark:border-[#2c2c3e] flex items-center justify-center`}
    >
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-contain p-2 md:p-3"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  )
}
