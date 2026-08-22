'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flame, Package, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice, getProductPricing } from '@/lib/utils'

interface HeroOffersCarouselProps {
  products: Product[]
}

/** Time between automatic slide advances (spec: every 3–4s) */
const AUTO_ADVANCE_MS = 4000
/** How long auto-scroll stays paused after a manual interaction */
const RESUME_AFTER_INTERACT_MS = 6000
/** Cap the number of slides so the hero never becomes a marathon */
const MAX_SLIDES = 8

/**
 * Full-bleed "Offers" slider for the hero's right-hand column.
 *
 * Slides live in a native horizontally-scrolling track with CSS scroll-snap,
 * so transitions are compositor-driven (hardware-accelerated) and touch
 * swiping works out of the box on mobile — no JS animation loop needed.
 */
export function HeroOffersCarousel({ products }: HeroOffersCarouselProps) {
  // Only genuine discounts, capped — saleProducts arrives pre-filtered from
  // getHomepageData(), this is just belt-and-braces.
  const offers = products
    .filter((p) => p.compare_at_price !== null && p.compare_at_price > p.price)
    .slice(0, MAX_SLIDES)

  const trackRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }, [])

  /** Pause auto-scroll, then resume a few seconds after the last interaction. */
  const pauseTemporarily = useCallback(() => {
    setIsPaused(true)
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    resumeTimeout.current = setTimeout(() => {
      if (!hoverRef.current) setIsPaused(false)
    }, RESUME_AFTER_INTERACT_MS)
  }, [])

  const goPrev = useCallback(() => {
    pauseTemporarily()
    scrollToSlide((activeIndex - 1 + offers.length) % offers.length)
  }, [activeIndex, offers.length, pauseTemporarily, scrollToSlide])

  const goNext = useCallback(() => {
    pauseTemporarily()
    scrollToSlide((activeIndex + 1) % offers.length)
  }, [activeIndex, offers.length, pauseTemporarily, scrollToSlide])

  // Keep the active dot in sync with the scroll position (manual swipes too).
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth)
      setActiveIndex(Math.min(Math.max(idx, 0), offers.length - 1))
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [offers.length])

  // Auto-advance loop. The next index is derived from the real scroll
  // position, so it always continues from wherever the user left off.
  useEffect(() => {
    if (isPaused || offers.length <= 1) return
    const id = setInterval(() => {
      const track = trackRef.current
      if (!track) return
      const current = Math.round(track.scrollLeft / track.clientWidth)
      scrollToSlide(current + 1 >= offers.length ? 0 : current + 1)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [isPaused, offers.length, scrollToSlide])

  // Pause while the tab is hidden; clean up the resume timer on unmount.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setIsPaused(true)
      else if (!hoverRef.current) setIsPaused(false)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    }
  }, [])

  if (offers.length === 0) return null

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    pauseTemporarily()
    addItem(product, 1)
    toast.success(`${product.name} added to cart!`, {
      style: {
        background: 'var(--primary)',
        color: '#fff',
        borderRadius: '12px',
      },
      icon: '🛒',
    })
  }

  return (
    <div
      className="relative aspect-[4/3] lg:aspect-[5/4] rounded-[2rem] overflow-hidden shadow-2xl bg-gray-100"
      onMouseEnter={() => {
        hoverRef.current = true
        setIsPaused(true)
      }}
      onMouseLeave={() => {
        hoverRef.current = false
        setIsPaused(false)
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="This week's offers"
    >
      {/* Slides track — native scroll + snap = smooth, GPU-accelerated, swipeable */}
      <div
        ref={trackRef}
        onTouchStart={pauseTemporarily}
        className="flex h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
      >
        {offers.map((product, index) => {
          const { regularPrice, salePrice, discountPercentage } = getProductPricing(product)
          const offerPrice = salePrice ?? product.price
          const outOfStock = product.stock_quantity <= 0

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="relative block h-full w-full flex-shrink-0 snap-center"
              aria-label={`${product.name} — ${discountPercentage}% off`}
              tabIndex={index === activeIndex ? 0 : -1}
            >
              {/* Product image (or branded placeholder) */}
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-lighter)] to-emerald-50 flex flex-col items-center justify-center text-[var(--primary)]">
                  <Package className="w-16 h-16 opacity-20 mb-2" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-green-600/40">No Image</span>
                </div>
              )}

              {/* Readability gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />

              {/* Discount badge — brand primary green */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[var(--primary)] text-white text-sm font-extrabold px-3.5 py-1.5 rounded-full shadow-lg">
                  <Flame className="w-4 h-4" />
                  {discountPercentage}% OFF
                </div>
              )}
              {/* Copy: title, weight, prices (padded clear of dots & + button) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 pb-9 md:pb-10 pr-16">
                <h3 className="text-white font-bold text-base md:text-xl leading-snug line-clamp-2">
                  {product.name}
                </h3>
                {product.weight_options && product.weight_options.length > 0 && (
                  <p className="text-white/70 text-xs md:text-sm font-medium mt-0.5">
                    {product.weight_options[0].value}
                  </p>
                )}
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="text-white text-xl md:text-2xl font-extrabold">
                    {formatPrice(offerPrice)}
                  </span>
                  {regularPrice > offerPrice && (
                    <span className="text-white/60 text-sm md:text-base line-through">
                      {formatPrice(regularPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick add-to-cart */}
              <button
                type="button"
                onClick={(e) => handleAddToCart(e, product)}
                disabled={outOfStock}
                aria-label={`Add ${product.name} to cart`}
                className="absolute bottom-4 right-4 z-10 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-[var(--primary)] shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-[var(--primary)] hover:text-white focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:hover:scale-100"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </Link>
          )
        })}
      </div>

      {/* Prev / next arrows — desktop only; mobile users swipe */}
      {offers.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous offer"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-[var(--primary)] hover:bg-white transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next offer"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-[var(--primary)] hover:bg-white transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {offers.map((product, i) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  pauseTemporarily()
                  scrollToSlide(i)
                }}
                aria-label={`Go to offer ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-5 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

