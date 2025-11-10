/**
 * Shopping Cart API
 * 
 * Handles shopping cart operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, ShoppingCart, CartItem } from '@/lib/types/marketplace'

const db = getDatabase()

/**
 * GET /api/marketplace/cart
 * 
 * Get user's shopping cart
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    let cart = db.getShoppingCart(user.id)

    // Create cart if doesn't exist
    if (!cart) {
      cart = {
        id: `cart_${user.id}`,
        userId: user.id,
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      db.createShoppingCart(cart)
    }

    const response: ApiResponse<ShoppingCart> = {
      success: true,
      data: cart,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching cart:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/marketplace/cart
 * 
 * Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { productId, quantity } = body

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Product ID and valid quantity are required' },
        { status: 400 }
      )
    }

    const product = db.getProduct(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Product is not available' },
        { status: 400 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    let cart = db.getShoppingCart(user.id)
    if (!cart) {
      cart = {
        id: `cart_${user.id}`,
        userId: user.id,
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId)
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
      })
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    cart.tax = cart.subtotal * 0.08 // 8% tax
    cart.shipping = cart.subtotal > 50 ? 0 : 5.99 // Free shipping over $50
    cart.total = cart.subtotal + cart.tax + cart.shipping
    cart.updatedAt = new Date()

    db.createShoppingCart(cart)

    const response: ApiResponse<ShoppingCart> = {
      success: true,
      data: cart,
      message: 'Item added to cart',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error adding to cart:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/marketplace/cart
 * 
 * Remove item from cart or clear cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    let cart = db.getShoppingCart(user.id)
    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      )
    }

    if (productId) {
      // Remove specific item
      cart.items = cart.items.filter(item => item.productId !== productId)
    } else {
      // Clear entire cart
      cart.items = []
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    cart.tax = cart.subtotal * 0.08
    cart.shipping = cart.subtotal > 50 ? 0 : 5.99
    cart.total = cart.subtotal + cart.tax + cart.shipping
    cart.updatedAt = new Date()

    db.createShoppingCart(cart)

    const response: ApiResponse<ShoppingCart> = {
      success: true,
      data: cart,
      message: productId ? 'Item removed from cart' : 'Cart cleared',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating cart:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

