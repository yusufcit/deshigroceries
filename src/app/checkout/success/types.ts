export type OrderItem = {
  product_name: string
  weight_option?: string | null
  quantity: number
  total_price: number
}

export type Order = {
  id: string
  order_number: string
  total: number
  subtotal: number
  delivery_fee: number
  payment_method: 'card' | 'pay_on_delivery'
  payment_status: string
  delivery_date: string
  delivery_slot: string
  customer_name: string
  delivery_address_line1: string
  delivery_address_line2?: string | null
  delivery_city: string
  delivery_county?: string | null
  delivery_eircode?: string | null
  delivery_instructions?: string | null
  items: OrderItem[]
}

