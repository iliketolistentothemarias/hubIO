/**
 * Marketplace Types
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  description: string
  logo?: string
  verified: boolean
  rating?: number
  reviewCount?: number
  commissionRate: number
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  vendorId: string
  name: string
  description: string
  category: string
  price: number
  images: string[]
  stock: number
  sku?: string
  tags: string[]
  featured: boolean
  status: 'active' | 'inactive' | 'sold-out'
  rating?: number
  reviewCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  productId: string
  quantity: number
  price: number
}

export interface ShoppingCart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  userId: string
  vendorId: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  commission: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Commission {
  id: string
  orderId: string
  vendorId: string
  amount: number
  rate: number
  status: 'pending' | 'paid' | 'cancelled'
  paidAt?: Date
  createdAt: Date
}

