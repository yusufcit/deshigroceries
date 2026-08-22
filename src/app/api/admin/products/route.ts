import { createClient } from '@supabase/supabase-js'
import { createClient as createSupaClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Use regular SSR client for auth check
  const supabase = await createSupaClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role client to bypass RLS for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Parse and validate request body
  const body = await request.json()
  
  const { name, slug, description, price, compare_at_price, category_id, stock_quantity, image_url, is_available, is_featured } = body

  // The admin forms submit with noValidate, so validate carefully here and
  // return clear messages — the UI shows them as error toasts.

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  }

  // Accepts "2.99" and "2,99" (comma decimals). null = empty/absent, NaN = invalid text.
  const parseMoney = (v: unknown): number | null => {
    if (v === undefined || v === null || String(v).trim() === '') return null
    return parseFloat(String(v).replace(',', '.'))
  }

  const parsedPrice = parseMoney(price)
  if (parsedPrice === null || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return NextResponse.json({ error: 'A valid price is required (e.g. 2.99)' }, { status: 400 })
  }
  const parsedCompareAt = parseMoney(compare_at_price)
  if (parsedCompareAt !== null && !Number.isFinite(parsedCompareAt)) {
    return NextResponse.json({ error: 'Compare at price must be a valid number' }, { status: 400 })
  }
  const parsedStock =
    stock_quantity === undefined || stock_quantity === null || String(stock_quantity).trim() === ''
      ? 0
      : parseInt(String(stock_quantity), 10)
  if (!Number.isFinite(parsedStock) || parsedStock < 0) {
    return NextResponse.json({ error: 'Stock quantity must be a whole number' }, { status: 400 })
  }

  // Generate slug from name if not provided
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { data, error } = await supabaseAdmin.from('products').insert({
    name,
    slug: finalSlug,
    description: description || null,
    price: parsedPrice,
    compare_at_price: parsedCompareAt,
    category_id: category_id || null,
    stock_quantity: parsedStock,
    image_url: image_url || null,
    is_available: is_available ?? true,
    is_featured: is_featured ?? false,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data }, { status: 201 })
}
