'use client'

import { ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/lib/cart-store'
import { Button } from '@/components/ui/Button'

interface Product {
  id: string
  name: string
  price: number
  slug: string
  image_url?: string | null
  stock_quantity?: number
  weight_options?: Array<{ value: string; price: number }>
  category?: { name: string } | null
}

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem(product as any, 1)
    toast.success(`${product.name} added to cart!`, {
      style: {
        background: '#059669',
        color: '#fff',
        borderRadius: '12px',
      },
      icon: '🛒',
    })
  }

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full md:w-auto px-8 py-3 text-lg font-semibold shadow-lg"
      onClick={handleAddToCart}
      disabled={(product.stock_quantity ?? 0) <= 0}
    >
      <ShoppingCart className="w-5 h-5" />
      {(product.stock_quantity ?? 0) > 0 ? 'Add to Cart' : 'Out of Stock'}
    </Button>
  )
}