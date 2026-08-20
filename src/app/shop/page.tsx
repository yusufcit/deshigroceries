import { ProductCard } from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import { Product, Category } from '@/lib/types'
import Link from 'next/link'
import { Search, SlidersHorizontal, Grid3X3, List } from 'lucide-react'

export const metadata = {
  title: 'Shop - Deshi Grocery',
  description: 'Browse our full selection of fresh halal meat, fish, and groceries',
}

export const revalidate = 60

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[var(--background-alt)]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Shop All Products</h1>
              <p className="text-gray-600 mt-1">
                {products ? products.length : 0} products available
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <Link
                href="/shop"
                className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow-md shadow-green-500/20 hover:shadow-lg transition-all duration-200"
              >
                All Products
              </Link>
              {(categories as Category[]).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-gray-700 hover:bg-[var(--primary-lighter)] hover:text-[var(--primary)] border border-gray-200 hover:border-[var(--primary)] font-medium text-sm transition-all duration-200"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(products as Product[]).map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No products available</h2>
            <p className="text-gray-600 mb-6">Check back soon for new arrivals!</p>
            <Link href="/">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-semibold hover:bg-[var(--primary-hover)] transition-colors">
                Go Home
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
