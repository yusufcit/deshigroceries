import { Product } from '@/lib/types'
import { getProductPricing, formatPrice } from '@/lib/utils'

interface PriceDisplayProps {
  product: Product
  className?: string
  showDiscountBadge?: boolean
  priceSize?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Authoritative price display component.
 * Always computes pricing from the product's database fields.
 * Handles: normal price, sale price with strikethrough, expired/future sales,
 * invalid sale prices, out-of-stock, and zero prices.
 */
export function PriceDisplay({
  product,
  className = '',
  showDiscountBadge = true,
  priceSize = 'lg',
}: PriceDisplayProps) {
  const { regularPrice, salePrice, discountPercentage, isOnSale } =
    getProductPricing(product)

  const sizeClasses = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl',
  }

  const hasValidSale = isOnSale && salePrice !== null && salePrice < regularPrice

  return (
    <div className={`flex items-baseline gap-2 md:gap-3 ${className}`}>
      {hasValidSale ? (
        <>
          <span
            className={`font-bold text-[var(--primary)] ${sizeClasses[priceSize]}`}
          >
            {formatPrice(salePrice!)}
          </span>
          <span className="text-sm md:text-base text-gray-400 line-through font-medium">
            {formatPrice(regularPrice)}
          </span>
          {showDiscountBadge && discountPercentage > 0 && (
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md">
              <span aria-hidden="true">🔥</span>
              {discountPercentage}% OFF
            </span>
          )}
        </>
      ) : (
        <span
          className={`font-bold text-[var(--primary)] ${sizeClasses[priceSize]}`}
        >
          {formatPrice(regularPrice)}
        </span>
      )}
    </div>
  )
}
