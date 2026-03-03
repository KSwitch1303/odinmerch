'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, ChevronDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  category: string;
  images: string[];
  sizes: string[];
  inventory: number;
  is_active: boolean;
  created_at: string;
}

const categories = [
  { id: 'all', name: 'All Collections' },
  { id: 'evening', name: 'Evening Elegance' },
  { id: 'business', name: 'Business Class' },
  { id: 'casual', name: 'Casual Luxury' },
  { id: 'accessories', name: 'Accessories' },
];

const sortOptions = [
  { id: 'newest', name: 'Newest First' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'name', name: 'Name: A to Z' },
];

function cleanImageSrc(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[)\]]+$/g, '');
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold luxury-heading text-black mb-4">
            Our Collections
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Discover our carefully curated selection of luxury fashion pieces, 
            each crafted with exceptional attention to detail and premium materials.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </form>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:border-black transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="md:hidden mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">No products found</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className="luxury-button"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                  {/* Product Image */}
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <Image
                      src={cleanImageSrc(product.images?.[0]) || '/placeholder-product.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold luxury-heading text-black mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-black">{formatPrice(product.price)}</span>
                        {typeof product.compare_at_price === 'number' && product.compare_at_price > product.price ? (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.compare_at_price)}
                          </span>
                        ) : null}
                      </div>
                      {product.inventory === 0 ? (
                        <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                      ) : product.inventory < 5 ? (
                        <span className="text-sm text-amber-600 font-medium">Low Stock</span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">In Stock</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 border transition-colors ${
                      currentPage === pageNum
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
