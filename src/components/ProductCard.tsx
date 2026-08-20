'use client'

import Link from 'next/link'
import { Product } from '@/lib/types'
import { formatPrice, getDiscountPercentage } from '@/lib/utils'
import { Button } from './ui/Button'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingCart, Package, Star, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product, 1)
    toast.success(`${product.name} added to cart!`, {
      style: {
        background: '#059669',
        color: '#fff',
        borderRadius: '12px',
      },
      icon: '🛒',
    })
  }

  const discount = product.compare_at_price
    ? getDiscountPercentage(product.compare_at_price, product.price)
    : 0

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[var(--primary)] hover:-translate-y-1.5 card-hover">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-[var(--primary-lighter)] to-emerald-50 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--primary)]">
              <Package className="w-20 h-20 mb-3 opacity-20" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-green-600/40">Premium Fresh</span>
            </div>
          )}
          
          {/* Badges Container */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {/* Discount Badge */}
            {discount > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-scale-in">
                -{discount}% OFF
              </div>
            )}

            {/* Stock Status */}
            {product.stock_quantity <= 0 && (
              <div className="ml-auto bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                Out of Stock
              </div>
            )}
          </div>

          {/* Low Stock Badge */}
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse-soft">
                Only {product.stock_quantity} left
              </div>
            </div>
          )}

          {/* Quick Add Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="primary"
              size="sm"
              className="w-full shadow-xl backdrop-blur-sm bg-white/95 text-[var(--primary)] hover:bg-white hover:shadow-2xl"
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
            >
              <ShoppingCart className="w-4 h-4" />
              {product.stock_quantity <= 0 ? 'Sold Out' : 'Quick Add'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 md:p-5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between mb-2">
            {product.category ? (
              <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-lighter)] px-2.5 py-1 rounded-full">
                {product.category.name}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs text-gray-500 font-medium">4.8</span>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] text-sm md:text-base group-hover:text-[var(--primary)] transition-colors duration-200">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-xl md:text-2xl font-bold text-[var(--primary)]">
              {formatPrice(product.price)}
            </p>
            {product.compare_at_price && (
              <p className="text-sm text-gray-400 line-through font-medium">
                {formatPrice(product.compare_at_price)}
              </p>
            )}
          </div>

          {/* Add to Cart Button - Desktop only shown, mobile uses the overlay */}
          <Button
            variant="primary"
            size="sm"
            className="w-full font-semibold shadow-sm hidden md:inline-flex"
            onClick={handleAddToCart}
            disabled={product.stock_quantity <= 0}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Link>
  )
}
