import { createClient } from '@/lib/supabase/server'
import { Product, Category } from '@/lib/types'

/**
 * Fetches all data needed for the homepage in a single batch.
 * Used by the homepage server component for optimal caching.
 */
export async function getHomepageData() {
  const supabase = await createClient()

  // 1. Fetch categories first (needed to resolve collection category IDs)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const allCategories = (categories || []) as Category[]

  // Resolve category IDs for homepage collections by matching slug/name keywords
  const matchCategories = (keywords: string[]) =>
    allCategories
      .filter((c) =>
        keywords.some(
          (k) =>
            c.slug.toLowerCase().includes(k) || c.name.toLowerCase().includes(k)
        )
      )
      .map((c) => c.id)

  const meatIds = matchCategories(['meat', 'chicken', 'beef', 'lamb', 'mutton'])
  const pantryIds = matchCategories([
    'rice', 'flour', 'atta', 'spic', 'oil', 'grain', 'lentil',
    'canned', 'dry', 'sauce', 'condiment',
  ])
  const frozenIds = matchCategories(['frozen'])

  // 2. Run all product queries in parallel
  const [
    { data: featuredProducts },
    { data: saleProducts },
    { data: latestProducts },
    { data: meatProducts },
    { data: pantryProducts },
    { data: frozenProducts },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_available', true)
      .eq('is_featured', true)
      .limit(10),

    // Sale = compare_at_price higher than price (authoritative DB data)
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_available', true)
      .not('compare_at_price', 'is', null)
      .gt('stock_quantity', 0)
      .limit(10),

    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(10),

    meatIds.length
      ? supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_available', true)
          .in('category_id', meatIds)
          .limit(8)
      : Promise.resolve({ data: [] }),

    pantryIds.length
      ? supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_available', true)
          .in('category_id', pantryIds)
          .limit(8)
      : Promise.resolve({ data: [] }),

    frozenIds.length
      ? supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_available', true)
          .in('category_id', frozenIds)
          .limit(8)
      : Promise.resolve({ data: [] }),
  ])

  // Only keep products that genuinely have a discount
  const onSale = ((saleProducts || []) as Product[]).filter(
    (p) => p.compare_at_price && p.compare_at_price > p.price
  )

  return {
    categories: allCategories,
    featuredProducts: (featuredProducts || []) as Product[],
    saleProducts: onSale,
    latestProducts: (latestProducts || []) as Product[],
    meatProducts: (meatProducts || []) as Product[],
    pantryProducts: (pantryProducts || []) as Product[],
    frozenProducts: (frozenProducts || []) as Product[],
  }
}

