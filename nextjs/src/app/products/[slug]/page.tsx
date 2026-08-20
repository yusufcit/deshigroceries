import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPrice, getDiscountPercentage } from '@/lib/utils'
import { Package, Star, Check, Truck, Shield } from 'lucide-react'
import AddToCartButton from './AddToCartButton'

async function getProduct(slug: string) {
  const supabase = await createClient()

  // Try exact slug match first
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('slug', slug)
    .single()

  if (product) return product

  // Try URL-decoded slug (in case of spaces)
  const decodedSlug = decodeURIComponent(slug)
  if (decodedSlug !== slug) {
    const { data: decodedProduct } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('slug', decodedSlug)
      .single()
    if (decodedProduct) return decodedProduct
  }

  // Try matching by name as fallback
  const { data: nameMatch } = await supabase
    .from('products')
    .select('*, categories(name)')
    .ilike('name', slug.replace(/-/g, ' '))
    .limit(1)
    .single()

  if (nameMatch) return nameMatch

  return null
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const discount = product.compare_at_price
    ? getDiscountPercentage(product.compare_at_price, product.price)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link href={`/categories/${product.categories.name?.toLowerCase()}`} className="hover:text-[var(--primary)]">
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-lighter)] to-emerald-50">
                <Package className="w-32 h-32 text-[var(--primary)] opacity-30" strokeWidth={1.5} />
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                -{discount}% OFF
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.categories && (
              <span className="inline-block text-sm font-semibold text-[var(--primary)] bg-[var(--primary-lighter)] px-3 py-1.5 rounded-full">
                {product.categories.name}
              </span>
            )}

            <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-500">(4.8 out of 5)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-[var(--primary)]">
                {formatPrice(product.price)}
              </p>
              {product.compare_at_price && (
                <p className="text-xl text-gray-400 line-through font-medium">
                  {formatPrice(product.compare_at_price)}
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock_quantity > 0 ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">
                    In Stock
                    {product.stock_quantity <= 5 && (
                      <span className="text-amber-600 ml-1">(Only {product.stock_quantity} left)</span>
                    )}
                  </span>
                </>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Weight Options */}
            {product.weight_options && product.weight_options.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight Options</label>
                <div className="flex flex-wrap gap-2">
                  {product.weight_options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary-lighter)] transition-colors text-sm font-medium text-gray-700"
                    >
                      {opt.value} - {formatPrice(opt.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="pt-4">
              <AddToCartButton product={product} />
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Free delivery over €50</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Premium Quality</p>
              </div>
              <div className="text-center">
                <Check className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Fresh Guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}