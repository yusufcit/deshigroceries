'use client'

import Link from 'next/link'
import { Product } from '@/lib/types'
import { ProductImage } from '@/components/ProductImage'
import { PriceDisplay } from '@/components/PriceDisplay'
import { ProductCardSkeleton } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingCart, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProductPricing } from '@/lib/utils'

export { ProductCardSkeleton }

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const { isOnSale, discountPercentage } = getProductPricing(product)
  const outOfStock = product.stock_quantity <= 0

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <article
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col h-full group-hover:shadow-xl group-hover:border-[var(--primary)] group-hover:-translate-y-1.5"
      >
        {/* Image */}
        <div className="relative flex-shrink-0">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            aspect="square"
            className="rounded-t-2xl transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {isOnSale && discountPercentage > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-0.5">
                <span aria-hidden="true">🔥</span>
                {discountPercentage}% OFF
              </div>
            )}

            {outOfStock && (
              <div className="ml-auto bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full font-medium text-xs shadow-lg">
                Out of Stock
              </div>
            )}
          </div>

          {/* Low stock badge */}
          {!outOfStock && product.stock_quantity <= 5 && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                Only {product.stock_quantity} left
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 md:p-5 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-lighter)] px-2.5 py-1 rounded-full w-fit mb-2">
              {product.category.name}
            </span>
          )}

          {/* Name */}
          <h3 className="font-bold text-gray-900 mb-0.5 line-clamp-2 text-sm md:text-base group-hover:text-[var(--primary)] transition-colors">
            {product.name}
          </h3>

          {/* Pack size / weight */}
          {product.weight_options && product.weight_options.length > 0 && (
            <p className="text-xs text-gray-400 font-medium mb-2">
              {product.weight_options[0].value}
            </p>
          )}
          <div className="flex-1" />

          {/* Price */}
          <div className="mb-3">
            <PriceDisplay product={product} priceSize="sm" showDiscountBadge={false} />
          </div>

          {/* Add to Cart */}
          <Button
            variant="primary"
            size="sm"
            className="w-full font-semibold shadow-sm group-hover:shadow-md transition-all"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingCart className="w-4 h-4" />
            {outOfStock ? 'Sold Out' : 'Add to Cart'}
          </Button>
        </div>
      </article>
    </Link>
  )
}
