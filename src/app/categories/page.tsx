import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Package } from 'lucide-react'

export const metadata = {
  title: 'Categories - Deshi Grocery',
  description: 'Browse our categories of fresh halal meat, fish, and groceries',
}

export const revalidate = 60

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Fetch all categories with product counts
  const { data: categories } = await supabase
    .from('categories')
    .select('*, products:products(count)')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Fallback emoji icons for categories without images
  const categoryIcons: Record<string, string> = {
    chicken: '🐔',
    lamb: '🐑',
    beef: '🥩',
    fish: '🐟',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-[var(--primary)]">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h1>
          <p className="text-lg text-gray-600">
            Browse our selection of fresh halal products by category
          </p>
        </div>

        {/* Categories Grid */}
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(categories as any[]).map((category) => {
              const icon = categoryIcons[category.slug] || '🥩'
              const hasImage = category.image_url && (
                category.image_url.startsWith('http://') || 
                category.image_url.startsWith('https://')
              )
              
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[var(--primary)] hover:-translate-y-2">
                    <div className="relative h-56 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent" />
                      {hasImage ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-8xl group-hover:scale-125 transition-transform duration-500 relative z-10">{icon}</span>
                      )}
                      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-[var(--primary)] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        Fresh
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-[var(--primary)] transition-colors mb-2">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-[var(--primary)] font-semibold">
                        <span>View Products</span>
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No categories available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
