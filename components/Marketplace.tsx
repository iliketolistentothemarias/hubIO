'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Store, Package, TrendingUp, Star, Search, Filter } from 'lucide-react'
import { Product, Vendor } from '@/lib/types/marketplace'
import LiquidGlass from './LiquidGlass'
import { useRouter } from 'next/navigation'
import { getAuthService } from '@/lib/auth'

export default function Marketplace() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
    loadVendors()
  }, [selectedCategory, searchQuery])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : ''
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
      const response = await fetch(`/api/marketplace/products?${categoryParam}${searchParam}`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/marketplace/vendors')
      const data = await response.json()
      if (data.success) {
        setVendors(data.data)
      }
    } catch (error) {
      console.error('Error loading vendors:', error)
    }
  }

  const handleAddToCart = async (productId: string) => {
    const auth = getAuthService()
    const authenticated = await auth.isAuthenticated()

    if (!authenticated) {
      router.push('/signup?message=Please create an account to shop')
      return
    }

    try {
      const response = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('Added to cart!')
      } else {
        alert(data.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart')
    }
  }

  const categories = ['All', 'Food', 'Services', 'Products', 'Art', 'Books', 'Clothing']

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 via-white to-primary-50/30 
                        dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Store className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Community Marketplace
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Shop local products and services from community vendors. Support your neighbors while finding what you need.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-2xl font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <LiquidGlass intensity="medium">
                  <div className="p-6">
                    {product.images && product.images.length > 0 && (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                        {product.category}
                      </span>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${product.price.toFixed(2)}
                      </div>
                      {product.stock > 0 ? (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {product.stock} in stock
                        </span>
                      ) : (
                        <span className="text-sm text-red-600 dark:text-red-400">Out of stock</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl 
                               font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5 inline mr-2" />
                      Add to Cart
                    </button>
                  </div>
                </LiquidGlass>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

