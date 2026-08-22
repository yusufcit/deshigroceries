'use client'

import Image from 'next/image'
import { Package } from 'lucide-react'
import { useState } from 'react'

interface ProductImageProps {
  src: string | null
  alt: string
  className?: string
  priority?: boolean
  aspect?: 'square' | 'video' | 'portrait'
}

/**
 * Optimized product image component.
 * Uses Next.js Image with fill mode for automatic optimization,
 * lazy loading, responsive sizes, and blur placeholders.
 * Falls back to an icon + label when no image URL is provided.
 */
export function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
  aspect = 'square',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  if (!src || hasError) {
    return (
      <div
        className={`relative ${aspectClasses[aspect]} bg-gradient-to-br from-[var(--primary-lighter)] to-emerald-50 overflow-hidden flex flex-col items-center justify-center text-[var(--primary)] ${className}`}
      >
        <Package className="w-16 h-16 opacity-20 mb-2" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-green-600/40">No Image</span>
      </div>
    )
  }

  return (
    <div
      className={`relative ${aspectClasses[aspect]} overflow-hidden bg-gray-50 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/svg+xml,%25 base64,PHN2ZSB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNEOEQ4RDgiLz48L3N2Zz4="
        onError={() => setHasError(true)}
        className="object-cover transition-transform duration-300"
      />
    </div>
  )
}

/**
 * Simple image with blur placeholder and error fallback — for hero/banners.
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  priority = false,
  sizes = '100vw',
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/svg+xml,%25 base64,PHN2ZSB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNEOEQ4RDgiLz48L3N2Zz4="
        className="object-cover"
      />
    </div>
  )
}
