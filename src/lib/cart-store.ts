import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from './types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity: number, weight_option?: string) => void
  removeItem: (productId: string, weight_option?: string) => void
  updateQuantity: (productId: string, quantity: number, weight_option?: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, weight_option) => {
        const items = get().items
        const selected_price = weight_option
          ? product.weight_options?.find(w => w.value === weight_option)?.price || product.price
          : product.price

        const existingItemIndex = items.findIndex(
          item => item.product.id === product.id && item.weight_option === weight_option
        )

        if (existingItemIndex > -1) {
          // Update quantity if item already exists
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += quantity
          set({ items: updatedItems })
        } else {
          // Add new item
          set({
            items: [...items, { product, quantity, weight_option, selected_price }]
          })
        }
      },

      removeItem: (productId, weight_option) => {
        set({
          items: get().items.filter(
            item => !(item.product.id === productId && item.weight_option === weight_option)
          )
        })
      },

      updateQuantity: (productId, quantity, weight_option) => {
        if (quantity <= 0) {
          get().removeItem(productId, weight_option)
          return
        }

        const items = get().items
        const itemIndex = items.findIndex(
          item => item.product.id === productId && item.weight_option === weight_option
        )

        if (itemIndex > -1) {
          const updatedItems = [...items]
          updatedItems[itemIndex].quantity = quantity
          set({ items: updatedItems })
        }
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.selected_price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'deshi-grocery-cart',
    }
  )
)
