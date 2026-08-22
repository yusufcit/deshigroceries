'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState, useEffect, ReactNode } from 'react'

interface ProductCarouselProps {
  children: ReactNode
}

/**
 * Bare horizontal scrollable row with prev/next controls.
 * Section headers and containers are managed by the parent page.
 * Children should be fixed-width flex items (e.g. w-[220px] flex-shrink-0).
 */
export function ProductCarousel({ children }: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const el = containerRef.current
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true })
      window.addEventListener('resize', updateScrollButtons)
      return () => {
        el.removeEventListener('scroll', updateScrollButtons)
        window.removeEventListener('resize', updateScrollButtons)
      }
    }
  }, [])

  const scrollBy = (direction: 'left' | 'right') => {
    if (!containerRef.current) return
    const distance = Math.round(containerRef.current.clientWidth * 0.8)
    containerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative group/carousel">
      <div
        ref={containerRef}
        className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-8 container-custom mx-auto pb-2"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          onClick={() => scrollBy('left')}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-200 z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scrollBy('right')}
          aria-label="Scroll right"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-200 z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}