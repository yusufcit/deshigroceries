import { Category } from '@/lib/types'
import Link from 'next/link'

interface CategoryCardProps {
  category: Category & { product_count?: number }
  className?: string
}

/**
 * Elegant category card with image fallback (emoji) and product count badge.
 */
export function CategoryCard({ category, className = '' }: CategoryCardProps) {
  const hasImage = category.image_url && (
    category.image_url.startsWith('http://') ||
    category.image_url.startsWith('https://')
  )

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={`group block ${className}`}
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--primary-lighter)] via-emerald-50 to-teal-50 border border-[var(--border-light)] transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        {hasImage ? (
          <img
            src={category.image_url!}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl">
            <span role="img" aria-label={category.name}>
              🛒
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-xl md:text-2xl font-bold leading-tight">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-gray-200 mt-0.5 line-clamp-1">
              {category.description}
            </p>
          )}
        </div>
        {category.product_count !== undefined && (
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {category.product_count} {category.product_count === 1 ? 'product' : 'products'}
          </div>
        )}
      </div>
    </Link>
  )
}
