/**
 * Marketplace Orders API
 * 
 * Handles order creation and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { getPaymentService } from '@/lib/services/payments'
import { ApiResponse, Order, Commission } from '@/lib/types/marketplace'

const db = getDatabase()
const paymentService = getPaymentService()

/**
 * POST /api/marketplace/orders
 * 
 * Create an order from cart
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { shippingAddress, paymentMethod } = body

    if (!shippingAddress || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Shipping address and payment method are required' },
        { status: 400 }
      )
    }

    const cart = db.getShoppingCart(user.id)
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Verify all products are still available
    for (const item of cart.items) {
      const product = db.getProduct(item.productId)
      if (!product || product.status !== 'active' || product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Product ${product?.name || item.productId} is no longer available` },
          { status: 400 }
        )
      }
    }

    // Group items by vendor
    const ordersByVendor = new Map<string, typeof cart.items>()
    for (const item of cart.items) {
      const product = db.getProduct(item.productId)!
      const vendorId = product.vendorId

      if (!ordersByVendor.has(vendorId)) {
        ordersByVendor.set(vendorId, [])
      }
      ordersByVendor.get(vendorId)!.push(item)
    }

    const createdOrders: Order[] = []

    // Create order for each vendor
    for (const [vendorId, items] of ordersByVendor.entries()) {
      const vendor = db.getVendor(vendorId)
      if (!vendor) continue

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const tax = subtotal * 0.08
      const shipping = subtotal > 50 ? 0 : 5.99
      const total = subtotal + tax + shipping
      const commission = total * vendor.commissionRate

      // Process payment
      if (paymentMethod === 'stripe') {
        try {
          const paymentIntent = await paymentService.createStripePaymentIntent(
            total,
            `order_${vendorId}`,
            user.id,
            {
              orderType: 'marketplace',
              vendorId,
            }
          )

          // Create order
          const order: Order = {
            id: `order_${Date.now()}_${vendorId}`,
            userId: user.id,
            vendorId,
            items,
            subtotal,
            tax,
            shipping,
            total,
            commission,
            status: 'pending',
            paymentMethod: 'stripe',
            paymentStatus: 'pending',
            shippingAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          db.createOrder(order)

          // Create commission record
          const commissionRecord: Commission = {
            id: `commission_${order.id}`,
            orderId: order.id,
            vendorId,
            amount: commission,
            rate: vendor.commissionRate,
            status: 'pending',
            createdAt: new Date(),
          }
          db.createCommission(commissionRecord)

          // Update product stock
          for (const item of items) {
            const product = db.getProduct(item.productId)!
            const updatedProduct = {
              ...product,
              stock: product.stock - item.quantity,
              updatedAt: new Date(),
            }
            db.createProduct(updatedProduct)
          }

          createdOrders.push(order)
        } catch (error: any) {
          console.error('Error processing payment:', error)
          return NextResponse.json(
            { success: false, error: error.message || 'Payment processing failed' },
            { status: 500 }
          )
        }
      }
    }

    // Clear cart
    if (createdOrders.length > 0) {
      const emptyCart = {
        ...cart,
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        updatedAt: new Date(),
      }
      db.createShoppingCart(emptyCart)
    }

    const response: ApiResponse<Order[]> = {
      success: true,
      data: createdOrders,
      message: 'Order created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/marketplace/orders
 * 
 * Get user's orders
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const orders = db.getOrdersByUser(user.id)

    // Enrich with product details
    const enrichedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const product = db.getProduct(item.productId)
        return {
          ...item,
          product: product
            ? {
                id: product.id,
                name: product.name,
                image: product.images[0],
                vendor: db.getVendor(product.vendorId)?.name,
              }
            : null,
        }
      }),
    }))

    const response: ApiResponse<typeof enrichedOrders> = {
      success: true,
      data: enrichedOrders,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching orders:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

