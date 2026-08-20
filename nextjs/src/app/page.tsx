import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import { Product, Category } from '@/lib/types'
import { TruckIcon, ShieldCheckIcon, ClockIcon, TagIcon, ArrowRight, Leaf, Sparkles } from 'lucide-react'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_available', true)
    .eq('is_featured', true)
    .limit(8)

  const { data: latestProducts } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const categoryIcons: Record<string, string> = {
    chicken: '🐔',
    lamb: '🐑',
    beef: '🥩',
    fish: '🐟',
  }

  const trustBadges = [
    {
      icon: TruckIcon,
      title: 'Fast Delivery',
      desc: 'Same-day delivery available',
      color: 'from-emerald-500 to-green-600',
    },
    {
      icon: ShieldCheckIcon,
      title: '100% Halal',
      desc: 'Certified halal products',
      color: 'from-green-500 to-teal-600',
    },
    {
      icon: ClockIcon,
      title: 'Fresh Daily',
      desc: 'Sourced fresh every day',
      color: 'from-teal-500 to-emerald-600',
    },
    {
      icon: TagIcon,
      title: 'Best Prices',
      desc: 'Competitive pricing',
      color: 'from-emerald-600 to-green-700',
    },
  ]

  return (
    <div className="w-full flex flex-col items-center gap-y-20 md:gap-y-32 bg-white">
    {/* ─── HERO SECTION ─── */}
      <section className="w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex justify-center">
      {/* CHANGE THIS INNER DIV LINE: Add pb-32 or pb-40 to handle the floating card overlap */}
        <div className="container-custom w-full pt-16 pb-32 md:pt-24 md:pb-40 lg:pt-32">

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-4 py-2 mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]">Premium Halal Groceries</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Fresh Halal Meat{' '}
                <span className="gradient-text">& Fish</span>{' '}
                <br className="hidden sm:block" />
                <span className="relative">
                  Delivered
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-[var(--primary)]" viewBox="0 0 200 12" fill="none">
                    <path d="M1 10C50 2 100 2 199 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
                  </svg>
                </span>{' '}
                to Your Door
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
                Premium quality halal groceries at competitive prices. 
                Order online and get same-day delivery across Dublin. 
                Freshness guaranteed, every time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/shop">
                  <Button size="lg" className="w-full sm:w-auto text-base shadow-lg hover:shadow-xl">
                    Shop Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                    Browse Categories
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-gray-200">
                <div className="flex -space-x-2">
                  {['👨‍👩‍👧‍👦', '🥩', '🐟', '🐔'].map((emoji, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center text-lg shadow-sm"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Trusted by <span className="text-[var(--primary)]">500+</span> families</p>
                  <p className="text-xs text-gray-500">in Dublin, Ireland</p>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in-up stagger-2">
              <div className="relative aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-400 via-[var(--primary)] to-teal-700 shadow-2xl shadow-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                {/* Decorative Elements */}
                <div className="absolute top-6 left-6 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float">
                  <span className="text-4xl">🥩</span>
                </div>
                <div className="absolute top-6 right-6 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float stagger-2">
                  <span className="text-3xl">🐟</span>
                </div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float stagger-3">
                  <span className="text-3xl">🐔</span>
                </div>
                <div className="absolute bottom-6 right-6 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float stagger-4">
                  <span className="text-4xl">🐑</span>
                </div>
                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                      <Leaf className="w-16 h-16 md:w-20 md:h-20 text-white" />
                    </div>
                    <p className="text-white/90 text-lg md:text-xl font-semibold">100% Halal Certified</p>
                    <p className="text-white/60 text-sm mt-1">Premium Quality Guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BADGES SECTION ─── */}
      <section className="w-full bg-white flex justify-center border-t border-b border-gray-100 pt-24 pb-16">
        <div className="container-custom w-full">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose Deshi Grocery?</h2>
            <p className="text-gray-600 text-lg">We deliver quality, freshness, and convenience</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {trustBadges.map((badge) => {
              const IconComponent = badge.icon;
              return (
                <div
                  key={badge.title}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-xl hover:border-[var(--primary)] transition-all duration-300 card-hover"
                >
                  <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${badge.color} text-white flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{badge.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{badge.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>





    {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="w-full bg-gray-50/50 flex justify-center border-b border-gray-100">
          {/* FIX: Increased padding from py-16 to py-20 md:py-24 for better vertical spacing */}
          <div className="container-custom w-full py-20 md:py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider">Categories</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                  Shop by Category
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Browse our selection of fresh halal products
                </p>
              </div>
              <Link href="/categories">
                <Button variant="outline" size="md">
                  View All Categories
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(categories as Category[]).map((category, index) => {
                const icon = categoryIcons[category.slug] || '🥩'
                const hasImage = category.image_url && (
                  category.image_url.startsWith('http://') || 
                  category.image_url.startsWith('https://')
                )
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[var(--primary)] hover:-translate-y-2 card-hover">
                      <div className="relative h-48 bg-gradient-to-br from-[var(--primary-lighter)] via-emerald-50 to-teal-50 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent" />
                        {hasImage ? (
                          <img
                            src={category.image_url || ''}
                            alt={category.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <span className="text-7xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 relative z-10">{icon}</span>
                        )}
                        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-[var(--primary)] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                          Fresh
                        </div>
                      </div>
                      <div className="p-5 text-center">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}


      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="w-full bg-white flex justify-center border-b border-gray-100">
          {/* FIX: Changed py-16 to py-20 md:py-24 to keep the breathing room identical to categories */}
          <div className="container-custom w-full py-20 md:py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider">Featured</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                  Featured Products
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Handpicked premium products just for you
                </p>
              </div>
              <Link href="/shop">
                <Button variant="outline" size="md">
                  View All Products
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(featuredProducts as Product[]).map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Latest Products */}
      {latestProducts && latestProducts.length > 0 && (
        <section className="w-full bg-gray-50/50 flex justify-center border-b border-gray-100">
          {/* FIX: Changed py-16 to py-20 md:py-24 to match your spacing system */}
          <div className="container-custom w-full py-20 md:py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider">New Arrivals</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                  New Arrivals
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Check out our latest products
                </p>
              </div>
              <Link href="/shop">
                <Button variant="outline" size="md">
                  View All New Arrivals
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(latestProducts as Product[]).map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ─── CTA SECTION ─── */}
      {/* Outer section cleanly manages full-width background and vertical breathing room */}
      <section className="relative w-full flex justify-center bg-gradient-to-r from-[var(--primary)] via-[var(--primary-hover)] to-[var(--primary-dark)] py-20 md:py-28">

        {/* FIX: Removed py-20 md:py-28 from here so padding doesn't double-stack on your footer */}
        <div className="relative container-custom w-full text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-semibold text-white">Special Offer</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight max-w-3xl">
            Ready to order fresh halal groceries?
          </h2>
          
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Sign up now and get <span className="font-bold text-yellow-300">€5 off</span> your first order over €30
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto bg-white text-[var(--primary)] hover:bg-green-50 hover:shadow-2xl shadow-xl text-base"
              >
                Sign Up Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/shop" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent text-white border-white/60 hover:bg-white/10 hover:border-white text-base"
              >
                Start Shopping
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-green-100/80 text-sm">
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Secure Checkout
            </span>
            <span className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4" />
              Free Delivery Over €50
            </span>
            <span className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Same-Day Delivery
            </span>
          </div>

        </div>
      </section>

    </div>
  )
}
