import Link from 'next/link'
import Image from 'next/image'
import { ProductCard } from '@/components/ProductCard'
import { ProductCarousel } from '@/components/ProductCarousel'
import { TrustCard } from '@/components/TrustCard'
import { PromoBanner } from '@/components/PromoBanner'
import { HeroOffersCarousel } from '@/components/HeroOffersCarousel'
import { getHomepageData } from '@/lib/homepage-data'
import { getCategoryIcon, TRUST_CARDS } from '@/lib/category-data'
import {
  ShieldCheck, Leaf, Truck, ShoppingBag, ArrowRight,
  Flame, BadgeCheck, Clock, Star,
} from 'lucide-react'

export const revalidate = 60

export const metadata = {
  title: 'Deshi Grocery — Fresh Halal Groceries Delivered in Dublin',
  description:
    'Shop quality halal meat, fish, groceries and everyday essentials from trusted suppliers. Free delivery in Dublin on orders over €50.',
}

const trustIcons = [
  <ShieldCheck key="1" className="w-7 h-7 text-[var(--primary)]" />,
  <Leaf key="2" className="w-7 h-7 text-[var(--primary)]" />,
  <Truck key="3" className="w-7 h-7 text-[var(--primary)]" />,
  <ShoppingBag key="4" className="w-7 h-7 text-[var(--primary)]" />,
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80'
const MEAT_BANNER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1600&q=80'
const PANTRY_BANNER =
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80'

export default async function Home() {
  const {
    categories,
    featuredProducts,
    saleProducts,
    latestProducts,
    meatProducts,
    pantryProducts,
    frozenProducts,
  } = await getHomepageData()

  const popularProducts =
    featuredProducts.length > 0 ? featuredProducts : latestProducts

  return (
    <div className="w-full bg-white">
      {/* ═══════════ 1. HERO ═══════════ */}
      <section className="mb-4 md:mb-6 w-full bg-gradient-to-br from-[var(--primary-lighter)] via-white to-amber-50/60">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-emerald-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <BadgeCheck className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary-dark)]">
                  100% Halal Certified
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-5">
                Fresh Halal Groceries,{' '}
                <span className="text-[var(--primary)]">Delivered</span> to Your
                Door
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                Shop quality halal meat, fish, groceries and everyday essentials
                from trusted suppliers — delivered across Dublin.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold px-8 py-3.5 rounded-full shadow-[var(--shadow-green)] hover:shadow-[var(--shadow-green-lg)] transition-all duration-200"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/shop?sale=true"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-bold px-8 py-3.5 rounded-full border border-gray-200 shadow-sm transition-all duration-200"
                >
                  <Flame className="w-5 h-5 text-[var(--accent)]" />
                  View Offers
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[var(--primary)]" />
                  Free delivery over €50
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  Same-day delivery
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
                  Trusted by Dublin families
                </span>
              </div>
            </div>
            {/* Visual — interactive Offers carousel (static image fallback when no offers) */}
            <div className="relative">
              {saleProducts.length > 0 ? (
                <HeroOffersCarousel products={saleProducts} />
              ) : (
                <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-[2rem] overflow-hidden shadow-2xl">
                  <Image
                    src={HERO_IMAGE}
                    alt="Fresh groceries and vegetables"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
              {/* Lowered to -bottom-14 so it clears the text */}
              <div className="absolute -bottom-14 -left-4 md:-left-8 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--primary-lighter)] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">100% Halal</p>
                  <p className="text-xs text-gray-500">Certified suppliers</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-3 md:-right-6 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Fast Delivery</p>
                  <p className="text-xs text-gray-500">Across Dublin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 2. SHOP BY CATEGORY ═══════════ */}
      {categories.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Shop by Category
                </h2>
                <p className="text-gray-600 mt-1">
                  Everything your kitchen needs, organised
                </p>
              </div>
              <Link
                href="/categories"
                className="hidden sm:inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold text-sm"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col items-center text-center bg-[var(--background-alt)] hover:bg-[var(--primary-lighter)] rounded-2xl p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 overflow-hidden">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl md:text-3xl" role="img" aria-hidden="true">
                        {getCategoryIcon(category.slug)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-gray-800 group-hover:text-[var(--primary)] line-clamp-2 leading-snug transition-colors">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ 3. THIS WEEK'S OFFERS (Sale carousel) ═══════════ */}
      {saleProducts.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10 bg-gradient-to-br from-red-50/70 via-amber-50/40 to-white">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <Flame className="w-3.5 h-3.5" />
                  SALE
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  This Week&apos;s Offers
                </h2>
                <p className="text-gray-600 mt-1">
                  Real discounts on real products — while stock lasts
                </p>
              </div>
              <Link
                href="/shop?sale=true"
                className="hidden sm:inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold text-sm"
              >
                View All Offers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <ProductCarousel>
            {saleProducts.map((product) => (
              <div
                key={product.id}
                className="w-[180px] sm:w-[210px] lg:w-[240px] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </ProductCarousel>
        </section>
      )}

      {/* ═══════════ 4. POPULAR PRODUCTS ═══════════ */}
      {popularProducts.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Our Most Popular Products
                </h2>
                <p className="text-gray-600 mt-1">
                  Customer favourites, restocked daily
                </p>
              </div>
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold text-sm"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <ProductCarousel>
            {popularProducts.map((product) => (
              <div
                key={product.id}
                className="w-[180px] sm:w-[210px] lg:w-[240px] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </ProductCarousel>
        </section>
      )}

      {/* ═══════════ 5. PROMO BANNER ═══════════ */}
      <section className="my-3 md:my-4 w-full py-6 md:py-10">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <PromoBanner
            title="Fresh Halal Meat for Every Family Meal"
            description="Quality chicken, beef and lamb selected with care — cut fresh and delivered chilled."
            ctaLabel="Shop Fresh Meat"
            ctaHref={meatProducts[0]?.category ? `/categories/${meatProducts[0].category.slug}` : '/shop'}
            bgImage={MEAT_BANNER}
          />
        </div>
      </section>


      {/* ═══════════ 6. COLLECTION: FRESH MEAT ═══════════ */}
      {meatProducts.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10 bg-[var(--background-alt)]">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Fresh Meat
                </h2>
                <p className="text-gray-600 mt-1">
                  Halal chicken, beef and lamb — cut fresh daily
                </p>
              </div>
              {meatProducts[0]?.category && (
                <Link
                  href={`/categories/${meatProducts[0].category.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
          <ProductCarousel>
            {meatProducts.map((product) => (
              <div
                key={product.id}
                className="w-[180px] sm:w-[210px] lg:w-[240px] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </ProductCarousel>
        </section>
      )}

      {/* ═══════════ 7. COLLECTION: PANTRY ESSENTIALS ═══════════ */}
      {pantryProducts.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Pantry Essentials
                </h2>
                <p className="text-gray-600 mt-1">
                  Rice, spices, oils and everyday staples
                </p>
              </div>
              {pantryProducts[0]?.category && (
                <Link
                  href={`/categories/${pantryProducts[0].category.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
          <ProductCarousel>
            {pantryProducts.map((product) => (
              <div
                key={product.id}
                className="w-[180px] sm:w-[210px] lg:w-[240px] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </ProductCarousel>
        </section>
      )}

      {/* ═══════════ 8. COLLECTION: FROZEN FAVOURITES ═══════════ */}
      {frozenProducts.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10 bg-[var(--background-alt)]">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Frozen Favourites
                </h2>
                <p className="text-gray-600 mt-1">
                  Ready-to-cook convenience for busy days
                </p>
              </div>
              {frozenProducts[0]?.category && (
                <Link
                  href={`/categories/${frozenProducts[0].category.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
          <ProductCarousel>
            {frozenProducts.map((product) => (
              <div
                key={product.id}
                className="w-[180px] sm:w-[210px] lg:w-[240px] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </ProductCarousel>
        </section>
      )}


      {/* ═══════════ 9. SECOND PROMO BANNER ═══════════ */}
      {pantryProducts.length > 0 && (
        <section className="my-3 md:my-4 w-full py-6 md:py-10">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <PromoBanner
              title="Authentic Spices & Pantry Staples"
              description="Stock your kitchen with premium basmati rice, aromatic spices and everyday essentials."
              ctaLabel="Shop Pantry"
              ctaHref={pantryProducts[0]?.category ? `/categories/${pantryProducts[0].category.slug}` : '/shop'}
              bgImage={PANTRY_BANNER}
            />
          </div>
        </section>
      )}

      {/* ═══════════ 10. WHY CHOOSE US ═══════════ */}
      <section id="why-us" className="my-3 md:my-4 w-full py-6 md:py-10 bg-[var(--background-alt)]">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Why Choose Deshi Grocery
            </h2>
            <p className="text-gray-600 mt-2 max-w-xl mx-auto">
              The halal grocery store Dublin families trust for quality,
              freshness and honest prices.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {TRUST_CARDS.map((card, i) => (
              <TrustCard
                key={card.title}
                icon={trustIcons[i]}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 11. DELIVERY INFO ═══════════ */}
      <section id="delivery" className="my-3 md:my-4 w-full py-6 md:py-10">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Delivery Across Dublin
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                We deliver fresh halal groceries across Dublin city and suburbs.
                Order before 2pm for same-day delivery on weekdays.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <span><strong>Free delivery</strong> on orders over €50</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <span><strong>Same-day delivery</strong> available Mon–Sat</span>
                </li>
                <li className="flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
                  <span><strong>Chilled transport</strong> keeps meat & fish fresh</span>
                </li>
              </ul>
            </div>
            <div className="bg-[var(--primary-lighter)] rounded-3xl p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delivery Areas & Fees
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900">Dublin City</p>
                    <p className="text-xs text-gray-500">D01 – D08</p>
                  </div>
                  <p className="font-bold text-[var(--primary)]">€4.99</p>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900">Dublin Suburbs</p>
                    <p className="text-xs text-gray-500">D09 – D24</p>
                  </div>
                  <p className="font-bold text-[var(--primary)]">€6.99</p>
                </div>
                <p className="text-xs text-gray-500 text-center pt-1">
                  Free on all orders over €50
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 12. FINAL CTA ═══════════ */}
      <section className="my-3 md:my-4 w-full bg-[var(--primary-dark)] relative overflow-hidden">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Weekly Groceries, Made Easy.
          </h2>
          <p className="text-lg text-emerald-100/90 mb-8 max-w-xl mx-auto">
            Fresh halal meat, fish and pantry staples — delivered to your door
            anywhere in Dublin.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-white text-[var(--primary-dark)] font-bold px-10 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-emerald-50 transition-all duration-200 text-lg"
          >
            Start Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
