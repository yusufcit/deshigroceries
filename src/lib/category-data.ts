/**
 * Category display data: emoji icons and image URLs keyed by category slug.
 *
 * The emoji icons serve as a reliable fallback that always renders (no network
 * dependency). The image URLs are Unsplash Source search links that return
 * on-brand, category-relevant photography. When the database `image_url` is
 * NULL or missing, the storefront falls back to the emoji so every category
 * gets a distinct visual identity based on its name.
 */

/**
 * Curated category display data for the homepage "Shop by Category" section.
 * Each entry maps to a friendly display name and emoji.
 * Actual categories are pulled from the database; this provides fallbacks.
 */
export interface CategoryDisplay {
  slug: string
  name: string
  icon: string
  description: string
}

/**
 * Well-known grocery categories for the homepage section.
 * These are display labels only — they map to actual DB categories by slug.
 */
export const HOMEPAGE_CATEGORIES: CategoryDisplay[] = [
  { slug: 'chicken', name: 'Chicken', icon: '🐔', description: 'Fresh halal chicken cuts' },
  { slug: 'meat', name: 'Meat', icon: '🥩', description: 'Premium halal meat' },
  { slug: 'lamb', name: 'Lamb', icon: '🐑', description: 'Halal lamb cuts' },
  { slug: 'beef', name: 'Beef', icon: '🥩', description: 'Halal beef selections' },
  { slug: 'fish', name: 'Fish', icon: '🐟', description: 'Fresh fish & seafood' },
  { slug: 'rice', name: 'Rice', icon: '🍚', description: 'Premium basmati & more' },
  { slug: 'spices', name: 'Spices', icon: '🌶️', description: 'Authentic spice blends' },
  { slug: 'frozen', name: 'Frozen', icon: '❄️', description: 'Ready-to-cook favourites' },
  { slug: 'dairy', name: 'Dairy & Eggs', icon: '🥚', description: 'Fresh dairy & eggs' },
  { slug: 'drinks', name: 'Drinks', icon: '🥤', description: 'Beverages & juices' },
  { slug: 'snacks', name: 'Snacks', icon: '🍟', description: 'Treats & cravings' },
  { slug: 'bakery', name: 'Bakery', icon: '🥐', description: 'Fresh baked goods' },
]

/**
 * Trust card data for "Why Choose Us" section.
 */
export interface TrustCardData {
  title: string
  description: string
  icon: string
}

export const TRUST_CARDS: TrustCardData[] = [
  {
    title: '100% Halal',
    description: 'Every product is certified halal and sourced from trusted suppliers.',
    icon: '🛡️',
  },
  {
    title: 'Fresh Quality',
    description: 'Carefully selected products, sourced fresh every day for your family.',
    icon: '🌱',
  },
  {
    title: 'Dublin Delivery',
    description: 'Convenient home delivery across Dublin with real-time tracking.',
    icon: '🚚',
  },
  {
    title: 'Easy Ordering',
    description: 'Simple and secure online shopping with Stripe checkout.',
    icon: '💳',
  },
]

/**
 * Review type — designed so real reviews can be added later.
 * The homepage renders this structure; if no reviews exist, it shows a placeholder.
 */
export interface Review {
  id: string
  customer_name: string
  rating: number
  text: string
  product_name?: string
  created_at: string
}

/**
 * Placeholder: reviews would come from a reviews table in production.
 * Currently shows a "coming soon" state on the homepage.
 */
export const REVIEWS_PLACEHOLDER = true

export const categoryIcons: Record<string, string> = {
  // Meat & Seafood
  'meats-seafood': '🦞',
  'frozen-sea-food': '🐟',
  'frozen-meat-poultry': '🍗',
  'fresh-meat': '🥩',
  'eggs': '🥚',

  // Frozen
  'frozen-food': '❄️',
  'frozen-vegtables': '🥦',

  // Dry Goods / Pantry
  'dry-fruits-and-nuts': '🥜',
  'grains-millets': '🌾',
  'wheat-grains': '🌾',
  'lentils': '🟤',
  'rice': '🍚',
  'flours-atta': '🍞',
  'oils': '🫒',
  'spices': '🌶️',
  'condiments-kitchen': '🧂',
  'sauces': '🍯',
  'jams-spread': '🍓',
  'powder-grains': '🫘',
  'canned-foods': '🥫',
  'precooked-canned-food': '🍲',
  'ready-meals': '🍱',
  'snacks-crisps': '🍟',
  'bakery': '🥐',
  'cereals': '🥣',
  'tea-and-coffee': '☕',
  'drinks-juice-beverage': '🥤',
  'sweets-choclates': '🍭',
  'confectionery': '🍫',
  'grocery-staples': '🛒',

  // Dairy & Chilled
  'milk-cheese-youghurt': '🧀',
  'dairy-chilled-food': '🧊',

  // Produce
  'vegtables-fruits': '🥬',

  // Beauty
  'cosmetic': '💄',

  // Generic
  'general': '🛍️',
}

// Default fallback emoji (friendly grocery bag)
export const DEFAULT_CATEGORY_ICON = '🛒'

/**
 * Returns an emoji icon for a given category slug.
 * Falls back to DEFAULT_CATEGORY_ICON when no specific match exists.
 */
export function getCategoryIcon(slug: string): string {
  return categoryIcons[slug] || DEFAULT_CATEGORY_ICON
}

/**
 * Category-specific image URLs (Unsplash Source search).
 * Each URL redirects to a relevant photo at 400×400.
 * Used for seeding the database `image_url` column.
 */
export const categoryImageUrls: Record<string, string> = {
  'meats-seafood': 'https://source.unsplash.com/400x400/?seafood',
  'frozen-sea-food': 'https://source.unsplash.com/400x400/?frozen-fish',
  'frozen-meat-poultry': 'https://source.unsplash.com/400x400/?frozen-chicken',
  'fresh-meat': 'https://source.unsplash.com/400x400/?fresh-meat',
  'eggs': 'https://source.unsplash.com/400x400/?eggs',
  'frozen-food': 'https://source.unsplash.com/400x400/?frozen-food',
  'frozen-vegtables': 'https://source.unsplash.com/400x400/?frozen-vegetables',
  'dry-fruits-and-nuts': 'https://source.unsplash.com/400x400/?nuts,dried-fruit',
  'grains-millets': 'https://source.unsplash.com/400x400/?grains,millet',
  'wheat-grains': 'https://source.unsplash.com/400x400/?wheat,grain',
  'lentils': 'https://source.unsplash.com/400x400/?lentils',
  'rice': 'https://source.unsplash.com/400x400/?rice',
  'flours-atta': 'https://source.unsplash.com/400x400/?flour',
  'oils': 'https://source.unsplash.com/400x400/?cooking-oil',
  'spices': 'https://source.unsplash.com/400x400/?spices',
  'condiments-kitchen': 'https://source.unsplash.com/400x400/?condiments',
  'sauces': 'https://source.unsplash.com/400x400/?sauce',
  'jams-spread': 'https://source.unsplash.com/400x400/?jam',
  'powder-grains': 'https://source.unsplash.com/400x400/?spice-powder',
  'canned-foods': 'https://source.unsplash.com/400x400/?canned-goods',
  'precooked-canned-food': 'https://source.unsplash.com/400x400/?canned-food',
  'ready-meals': 'https://source.unsplash.com/400x400/?ready-meal',
  'snacks-crisps': 'https://source.unsplash.com/400x400/?snacks',
  'bakery': 'https://source.unsplash.com/400x400/?bakery',
  'cereals': 'https://source.unsplash.com/400x400/?cereal',
  'tea-and-coffee': 'https://source.unsplash.com/400x400/?tea',
  'drinks-juice-beverage': 'https://source.unsplash.com/400x400/?juice',
  'sweets-choclates': 'https://source.unsplash.com/400x400/?chocolate',
  'confectionery': 'https://source.unsplash.com/400x400/?candy',
  'grocery-staples': 'https://source.unsplash.com/400x400/?grocery',
  'milk-cheese-youghurt': 'https://source.unsplash.com/400x400/?cheese',
  'dairy-chilled-food': 'https://source.unsplash.com/400x400/?dairy',
  'vegtables-fruits': 'https://source.unsplash.com/400x400/?vegetables',
  'cosmetic': 'https://source.unsplash.com/400x400/?cosmetics',
  'general': 'https://source.unsplash.com/400x400/?grocery',
}

/**
 * Returns an image URL for a given category slug.
 * Returns null when no specific match exists (caller falls back to emoji).
 */
export function getCategoryImageUrl(slug: string): string | null {
  return categoryImageUrls[slug] || null
}