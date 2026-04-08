'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { hostnameFromWebsite, resourceLogoUrlCandidates } from '@/lib/utils/resource-logo'
import {
  bitmapLooksLikePixelSmileyOnWhite,
  shouldSkipDefaultAvatarUrl,
  urlSuggestsGravatarDefaultRisk,
} from '@/lib/utils/resource-default-avatar'
import { shouldUseYellowBrandResourceLogo } from '@/lib/utils/resource-yellow-heart'

type Props = {
  name: string
  website?: string | null
  /** Direct logo URL from DB or seed data (optional) */
  image?: string | null
  /** Unverified / pending resources use the yellow brand tile */
  verified?: boolean
  className?: string
  /** Smaller tile for directory list rows */
  variant?: 'hero' | 'compact'
}

/** Tiny favicons / generic globe icons are usually ≤64px intrinsic; reject so we show yellow + heart instead. */
const MAX_INTRINSIC_BAD_LOGO = 64

/**
 * Shows organization logo from `image`, else Clearbit/Google favicon from `website`, else yellow + white heart.
 */
export default function ResourceHeroLogo({
  name,
  website,
  image,
  verified,
  className = '',
  variant = 'hero',
}: Props) {
  const yellowBrandOnly = useMemo(
    () => shouldUseYellowBrandResourceLogo(name, { image, verified }),
    [name, image, verified]
  )

  const urls = useMemo(() => {
    if (yellowBrandOnly) return []
    return resourceLogoUrlCandidates(image, website).filter((u) => !shouldSkipDefaultAvatarUrl(u))
  }, [yellowBrandOnly, image, website])

  const [index, setIndex] = useState(0)
  /** Last candidate loaded but was a generic pixel smiley — yellow + white heart */
  const [yellowSmileyFallback, setYellowSmileyFallback] = useState(false)
  const host = useMemo(() => hostnameFromWebsite(website), [website])

  useEffect(() => {
    setIndex(0)
    setYellowSmileyFallback(false)
  }, [name, image, website, verified, yellowBrandOnly])

  const src = urls[index]
  const showImage = src != null && index < urls.length
  /** External absolute URLs: CORS so canvas can read pixels for smiley detection; skip for same-origin paths */
  const imgCrossOrigin = src && /^https?:\/\//i.test(src.trim()) ? ('anonymous' as const) : undefined

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

  const advanceToNextSource = () => {
    setYellowSmileyFallback(false)
    setIndex((i) => i + 1)
  }

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget
    const { naturalWidth: w, naturalHeight: h } = el
    const last = index >= urls.length - 1

    if (w > 0 && h > 0 && Math.max(w, h) <= MAX_INTRINSIC_BAD_LOGO) {
      advanceToNextSource()
      return
    }

    if (bitmapLooksLikePixelSmileyOnWhite(el)) {
      if (!last) advanceToNextSource()
      else setYellowSmileyFallback(true)
      return
    }

    if (
      last &&
      src &&
      urlSuggestsGravatarDefaultRisk(src) &&
      Math.max(w, h) > 0 &&
      Math.max(w, h) <= 128
    ) {
      setYellowSmileyFallback(true)
      return
    }

    setYellowSmileyFallback(false)
  }

  if (yellowSmileyFallback || !showImage) {
    return (
      <div
        className={`${boxClass} flex items-center justify-center bg-gradient-to-br from-amber-300 to-yellow-500 dark:from-amber-400 dark:to-yellow-600`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Heart className={`${heartClass} text-white drop-shadow-sm`} />
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
        crossOrigin={imgCrossOrigin}
        onLoad={handleImgLoad}
        onError={advanceToNextSource}
      />
    </div>
  )
}
