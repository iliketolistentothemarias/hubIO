/**
 * Marketplace Products API
 * 
 * Handles product listings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Product } from '@/lib/types/marketplace'

const db = getDatabase()

/**
 * POST /api/marketplace/products
 * 
 * Create a product listing
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { name, description, category, price, images, stock, tags, sku } = body

    if (!name || !description || !category || !price || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Name, description, category, and valid price are required' },
        { status: 400 }
      )
    }

    // Check if user is a vendor
    const vendor = db.getVendor(`vendor_${user.id}`)
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor registration required' },
        { status: 403 }
      )
    }

    if (!vendor.verified) {
      return NextResponse.json(
        { success: false, error: 'Vendor account must be verified' },
        { status: 403 }
      )
    }

    const product: Product = {
      id: `product_${Date.now()}_${user.id}`,
      vendorId: vendor.id,
      name,
      description,
      category,
      price: parseFloat(price),
      images: images || [],
      stock: stock || 0,
      sku,
      tags: tags || [],
      featured: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    db.createProduct(product)

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Product created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/marketplace/products
 * 
 * Get products with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let products = db.getAllProducts()

    // Filter by vendor
    if (vendorId) {
      products = products.filter(p => p.vendorId === vendorId)
    }

    // Filter by category
    if (category) {
      products = products.filter(p => p.category === category)
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Only active products
    products = products.filter(p => p.status === 'active')

    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

