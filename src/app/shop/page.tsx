import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import { Product, Category } from '@/lib/types'
import { getDiscountPercentage } from '@/lib/utils'
import { SearchX, Flame, LayoutGrid } from 'lucide-react'

export const metadata = {
  title: 'Shop — Deshi Grocery',
  description:
    'Browse our full selection of fresh halal meat, fish, groceries and everyday essentials.',
}

export const revalidate = 60

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'discount', label: 'Biggest Discount' },
]

function buildQueryString(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const merged = { ...base, ...overrides }
  const params = new URLSearchParams()
  Object.entries(merged).forEach(([k, v]) => {
    if (v) params.set(k, v)
  })
  const s = params.toString()
  return s ? `/shop?${s}` : '/shop'
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const rawQ = typeof params.q === 'string' ? params.q.trim() : ''
  // Sanitize search input for PostgREST filters
  const q = rawQ.replace(/[%,()."']/g, '').slice(0, 80)
  const saleOnly = params.sale === 'true'
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'
  const categorySlug = typeof params.category === 'string' ? params.category : ''

  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  let categoryId: string | null = null
  if (categorySlug) {
    const match = (categories as Category[] | null)?.find(
      (c) => c.slug === categorySlug
    )
    categoryId = match?.id || null
  }

  let productQuery = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_available', true)

  if (q) {
    productQuery = productQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }
  if (categoryId) {
    productQuery = productQuery.eq('category_id', categoryId)
  }
  if (saleOnly) {
    productQuery = productQuery.not('compare_at_price', 'is', null)
  }

  if (sort === 'price-asc') {
    productQuery = productQuery.order('price', { ascending: true })
  } else if (sort === 'price-desc') {
    productQuery = productQuery.order('price', { ascending: false })
  } else {
    productQuery = productQuery.order('created_at', { ascending: false })
  }

  const { data: products } = await productQuery.limit(60)

  let filtered = (products || []) as Product[]

  if (saleOnly) {
    filtered = filtered.filter(
      (p) => p.compare_at_price && p.compare_at_price > p.price
    )
  }

  if (sort === 'discount') {
    filtered = [...filtered].sort((a, b) => {
      const da = a.compare_at_price
        ? getDiscountPercentage(a.compare_at_price, a.price)
        : 0
      const db = b.compare_at_price
        ? getDiscountPercentage(b.compare_at_price, b.price)
        : 0
      return db - da
    })
  }

  const currentParams = {
    q: rawQ || undefined,
    sale: saleOnly ? 'true' : undefined,
    category: categorySlug || undefined,
    sort: sort !== 'newest' ? sort : undefined,
  }

  const pageTitle = q
    ? `Results for "${rawQ}"`
    : saleOnly
      ? 'This Week\u2019s Offers'
      : categorySlug
        ? (categories as Category[] | null)?.find((c) => c.slug === categorySlug)
            ?.name || 'Shop'
        : 'Shop All Products'

  return (
    <div className="w-full min-h-screen bg-[var(--background-alt)]">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-center gap-3">
            {saleOnly && (
              <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5" /> SALE
              </span>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {pageTitle}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
                {q ? ' found' : ' available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Category pills */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <Link
              href={buildQueryString(currentParams, { category: undefined })}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                !categorySlug
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              All
            </Link>
            {(categories as Category[]).map((category) => (
              <Link
                key={category.id}
                href={buildQueryString(currentParams, { category: category.slug })}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categorySlug === category.slug
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {/* Sort row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
            Sort
          </span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={buildQueryString(currentParams, {
                sort: opt.key === 'newest' ? undefined : opt.key,
              })}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                sort === opt.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>


        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <SearchX className="w-10 h-10 text-gray-400" />
            </div>
            {q ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No products found for &ldquo;{rawQ}&rdquo;
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn&apos;t find anything matching your search. Try a
                  different keyword or browse our categories.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No products available
                </h2>
                <p className="text-gray-600 mb-6">
                  Check back soon — we restock daily.
                </p>
              </>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-full font-semibold hover:bg-[var(--primary-hover)] transition-colors"
              >
                Browse All Products
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
