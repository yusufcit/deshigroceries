import { type CartItem } from '@/lib/types'
import { type AvailableDay } from '@/lib/delivery-slots'

export type Step = 'auth' | 'address' | 'slot' | 'payment'

export interface AddressForm {
  email: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  county: string
  eircode: string
  delivery_instructions: string
}

export interface CheckoutCtx {
  user: any | null
  userLoaded: boolean
  isGuest: boolean
  step: Step
  setStep: (s: Step) => void
  addr: AddressForm
  setAddr: (p: Partial<AddressForm>) => void
  saveAddr: boolean
  setSaveAddr: (b: boolean) => void
  days: AvailableDay[]
  slotLoading: boolean
  selDate: string
  setSelDate: (d: string) => void
  selSlot: string
  setSelSlot: (s: string) => void
  selAvail: boolean
  slotOpts: { label: string; available: boolean }[]
  pm: 'card' | 'pay_on_delivery'
  setPm: (p: 'card' | 'pay_on_delivery') => void
  loading: boolean
  subtotal: number
  deliveryFee: number
  total: number
  items: CartItem[]
  canceled: boolean
}
