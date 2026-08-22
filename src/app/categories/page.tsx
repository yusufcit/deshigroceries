import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getCategoryIcon } from '@/lib/category-data'
import { ChevronRight, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Categories — Deshi Grocery',
  description:
    'Browse fresh halal meat, fish, rice, spices and grocery categories.',
}

export const revalidate = 60

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Get product counts per category in one query
  const { data: products } = await supabase
    .from('products')
    .select('category_id')
    .eq('is_available', true)

  const counts: Record<string, number> = {}
  ;(products || []).forEach((p: { category_id: string | null }) => {
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1
  })

  const hasImage = (url: string | null) =>
    !!url && (url.startsWith('http://') || url.startsWith('https://'))

  return (
    <div className="w-full min-h-screen bg-[var(--background-alt)]">
      <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[var(--primary)]">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Shop by Category
          </h1>
          <p className="text-gray-600">
            Everything your kitchen needs — fresh halal meat, pantry staples and more.
          </p>
        </div>

        {/* Category grid */}
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {(categories as any[]).map((category) => {
              const count = counts[category.id] || 0
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--primary)]"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--primary-lighter)] to-emerald-50 overflow-hidden">
                    {hasImage(category.image_url) ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-300" role="img" aria-hidden="true">
                          {getCategoryIcon(category.slug)}
                        </span>
                      </div>
                    )}
                    {count > 0 && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                        {count} {count === 1 ? 'item' : 'items'}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="p-4 md:p-5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-[var(--primary)] transition-colors truncate">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary-lighter)] flex items-center justify-center group-hover:bg-[var(--primary)] transition-colors">
                      <ArrowRight className="w-4 h-4 text-[var(--primary)] group-hover:text-white transition-colors" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center">
            <p className="text-gray-600">No categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
