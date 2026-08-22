/**
 * Class name helper — merges and deduplicates tailwind classes.
 * Simple implementation: concatenates non-empty strings.
 */
export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Format price in euros
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Get the effective pricing for a product, taking sale dates into account.
 * This is the authoritative pricing function — always prefer this on the server.
 */
export function getProductPricing(product: {
  price: number
  compare_at_price?: number | null
  sale_start_date?: string | null
  sale_end_date?: string | null
}): {
  regularPrice: number
  salePrice: number | null
  discountPercentage: number
  isOnSale: boolean
  isSaleActive: boolean
} {
  const now = new Date()
  let isSaleActive = false

  if (product.sale_start_date && product.sale_end_date) {
    const start = new Date(product.sale_start_date)
    const end = new Date(product.sale_end_date)
    isSaleActive = now >= start && now < end
  }

  // Fallback: if no sale dates are set but compare_at_price is lower, use it
  if (!isSaleActive && product.compare_at_price && product.compare_at_price > product.price) {
    isSaleActive = true
  }

  const salePrice = isSaleActive ? product.price : null
  const regularPrice = product.compare_at_price && product.compare_at_price > product.price
    ? product.compare_at_price
    : product.price

  const discountPercentage = salePrice && salePrice < regularPrice
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : 0

  return {
    regularPrice,
    salePrice: salePrice && salePrice < regularPrice ? salePrice : null,
    discountPercentage,
    isOnSale: isSaleActive && salePrice !== null && salePrice < regularPrice,
    isSaleActive,
  }
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `DG-${timestamp}-${random}`
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Calculate delivery fee based on eircode
 */
export function calculateDeliveryFee(eircode: string | undefined, zones: any[]): number {
  if (!eircode) return 4.99 // Default fee

  const prefix = eircode.substring(0, 3).toUpperCase()

  const zone = zones.find(z =>
    z.is_active && z.eircode_prefixes.includes(prefix)
  )

  return zone ? zone.delivery_fee : 6.99 // Default suburban fee
}

/**
 * Check if eircode is valid Dublin eircode
 */
export function isValidDublinEircode(eircode: string): boolean {
  if (!eircode) return false
  const prefix = eircode.substring(0, 1).toUpperCase()
  return prefix === 'D'
}

/**
 * Get discount percentage
 */
export function getDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= salePrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return statusMap[status] || status
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}
