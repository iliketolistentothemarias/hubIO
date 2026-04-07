'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { hostnameFromWebsite, resourceLogoUrlCandidates } from '@/lib/utils/resource-logo'

type Props = {
  name: string
  website?: string | null
  /** Direct logo URL from DB or seed data (optional) */
  image?: string | null
  className?: string
  /** Smaller tile for directory list rows */
  variant?: 'hero' | 'compact'
}

/**
 * Shows organization logo from `image`, else Clearbit/Google favicon from `website`, else heart placeholder.
 */
export default function ResourceHeroLogo({
  name,
  website,
  image,
  className = '',
  variant = 'hero',
}: Props) {
  const urls = useMemo(() => resourceLogoUrlCandidates(image, website), [image, website])
  const [index, setIndex] = useState(0)
  const host = useMemo(() => hostnameFromWebsite(website), [website])

  useEffect(() => {
    setIndex(0)
  }, [name, image, website])

  const src = urls[index]
  const showImage = src != null && index < urls.length

  /** Retina-friendly srcSet for providers that serve fixed bitmaps */
  const srcSet = useMemo(() => {
    if (!host || !src) return undefined
    if (src.includes('logo.clearbit.com')) {
      return `https://logo.clearbit.com/${host}?size=256 1x, https://logo.clearbit.com/${host}?size=512 2x`
    }
    if (src.includes('google.com/s2/favicons')) {
      const d = encodeURIComponent(host)
      return `https://www.google.com/s2/favicons?domain=${d}&sz=128 1x, https://www.google.com/s2/favicons?domain=${d}&sz=256 2x`
    }
    return undefined
  }, [src, host])

  const sizeClass =
    variant === 'compact'
      ? 'aspect-square w-[4.75rem] h-[4.75rem] sm:w-20 sm:h-20 mx-0 rounded-xl shadow-lg'
      : 'aspect-square w-28 h-28 sm:w-32 sm:h-32 md:w-44 md:h-44 mx-auto rounded-2xl md:rounded-3xl shadow-2xl'

  const heartClass =
    variant === 'compact' ? 'w-7 h-7 sm:w-9 sm:h-9 text-white' : 'w-11 h-11 sm:w-12 sm:h-12 md:w-[4.25rem] md:h-[4.25rem] text-white'

  const imgPad = variant === 'compact' ? 'p-0.5 sm:p-1' : 'p-1 md:p-2'

  const boxClass = `${sizeClass} relative group overflow-hidden ${className}`.trim()

  if (!showImage) {
    return (
      <div
        className={`${boxClass} bg-gradient-to-br from-[#8B6F47] to-[#D4A574] flex items-center justify-center`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Heart className={heartClass} />
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
        srcSet={srcSet}
        sizes={
          variant === 'compact'
            ? '(max-width: 640px) 76px, 80px'
            : '(max-width: 640px) 112px, (max-width: 768px) 128px, 176px'
        }
        alt={`${name} logo`}
        className={`h-full w-full object-contain antialiased [image-rendering:auto] [backface-visibility:hidden] ${imgPad}`}
        loading={variant === 'hero' ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={variant === 'hero' ? 'high' : 'low'}
        referrerPolicy="no-referrer"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  )
}
