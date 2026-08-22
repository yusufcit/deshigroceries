import { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface PromoBannerProps {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  bgImage?: string
  align?: 'left' | 'center'
}

/**
 * Large promotional banner with headline, description, and CTA.
 * Can use a background image or solid gradient.
 */
export function PromoBanner({
  title,
  description,
  ctaLabel,
  ctaHref,
  bgImage,
  align = 'left',
}: PromoBannerProps) {
  return (
    <section className="relative w-full py-16 md:py-24 lg:py-32 rounded-3xl overflow-hidden">
      {bgImage ? (
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-[var(--primary-dark)]" />
      )}
      <div className="absolute inset-0 bg-black/20" />

      <div
        className={`relative container-custom mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${
          align === 'center' ? 'text-center' : 'text-left'
        }`}
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
          {description}
        </p>
        <Button
          as="span"
          size="lg"
          className="bg-white text-[var(--primary)] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <a href={ctaHref} className="flex items-center gap-2">
            {ctaLabel}
          </a>
        </Button>
      </div>
    </section>
  )
}
