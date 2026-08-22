export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WeightOption {
  value: string
  price: number
}

export interface Product {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  image_url: string | null
  images: string[] | null
  weight_options: WeightOption[] | null
  stock_quantity: number
  is_available: boolean
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  category?: Category
  /** ISO date string — sale is active when now >= sale_start_date */
  sale_start_date: string | null
  /** ISO date string — sale is active when now < sale_end_date */
  sale_end_date: string | null
  sku: string | null
}

/**
 * A computed view of a product's effective pricing.
 * The backend (PriceDisplay, API) should always be authoritative.
 */
export interface ProductPricing {
  regularPrice: number
  salePrice: number | null
  discountPercentage: number
  isOnSale: boolean
  isSaleActive: boolean
}

export interface Customer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  customer_id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  county: string | null
  eircode: string | null
  delivery_instructions: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  customer_email: string
  customer_name: string
  customer_phone: string
  delivery_address_line1: string
  delivery_address_line2: string | null
  delivery_city: string
  delivery_county: string | null
  delivery_eircode: string | null
  delivery_instructions: string | null
  subtotal: number
  delivery_fee: number
  total: number
  payment_status: PaymentStatus
  payment_intent_id: string | null
  stripe_session_id: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
  delivered_at: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image_url: string | null
  weight_option: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface DeliveryZone {
  id: string
  name: string
  eircode_prefixes: string[]
  delivery_fee: number
  minimum_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  id: string
  setting_key: string
  setting_value: any
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
}

// Cart types
export interface CartItem {
  product: Product
  quantity: number
  weight_option?: string
  selected_price: number
}

// Checkout types
export interface CheckoutFormData {
  email: string
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  county?: string
  eircode?: string
  delivery_instructions?: string
}
