'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Banknote, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Package, 
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  productGrowth: number;
}

interface RecentOrder {
  _id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
}

interface TopProduct {
  _id: string;
  name: string;
  price: number;
  sales: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0,
    productGrowth: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/orders?adminDashboard=1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          setLoading(false);
          return;
        }

        setStats(json.data.stats);
        setRecentOrders(Array.isArray(json.data.recentOrders) ? json.data.recentOrders : []);
        setTopProducts(Array.isArray(json.data.topProducts) ? json.data.topProducts : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor your luxury boutique performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-black to-gray-800 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Revenue</p>
              <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <div className="flex items-center">
              {stats.revenueGrowth >= 0 ? (
                <ArrowUpRight className="h-5 w-5 text-green-400" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-400" />
              )}
              <span className={`ml-1 text-sm ${stats.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(stats.revenueGrowth)}%
              </span>
            </div>
          </div>
          <div className="mt-4">
              <Banknote className="h-8 w-8 opacity-60" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-black">{stats.totalOrders}</p>
            </div>
            <div className="flex items-center">
              {stats.orderGrowth >= 0 ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              )}
              <span className={`ml-1 text-sm ${stats.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(stats.orderGrowth)}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
        </div>

          {/* Total Customers */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-black">{stats.totalCustomers}</p>
              </div>
              <div className="flex items-center">
                {stats.customerGrowth >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
                <span className={`ml-1 text-sm ${stats.customerGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(stats.customerGrowth)}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-black">{stats.totalProducts}</p>
              </div>
              <div className="flex items-center">
                {stats.productGrowth >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
                <span className={`ml-1 text-sm ${stats.productGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(stats.productGrowth)}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Recent Orders and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black">Recent Orders</h2>
              <Link href="/admin/orders" className="text-black hover:text-gray-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">No orders yet.</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-black">Order #{order._id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        Customer {order.user_id ? order.user_id.slice(-8) : '—'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">{formatPrice(order.total)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black">Top Products</h2>
              <Link href="/admin/products" className="text-black hover:text-gray-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-black">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">{formatPrice(product.revenue)}</p>
                    <p className="text-sm text-gray-500">{formatPrice(product.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/products"
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
          >
            <Package className="h-8 w-8 text-black mx-auto mb-2" />
            <p className="text-sm font-medium text-black">Manage Products</p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
          >
            <ShoppingBag className="h-8 w-8 text-black mx-auto mb-2" />
            <p className="text-sm font-medium text-black">View Orders</p>
          </Link>
          <Link
            href="/admin/customers"
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
          >
            <Users className="h-8 w-8 text-black mx-auto mb-2" />
            <p className="text-sm font-medium text-black">Manage Customers</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
          >
            <TrendingUp className="h-8 w-8 text-black mx-auto mb-2" />
            <p className="text-sm font-medium text-black">View Analytics</p>
          </Link>
          <Link
            href="/admin/content"
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
          >
            <Eye className="h-8 w-8 text-black mx-auto mb-2" />
            <p className="text-sm font-medium text-black">Brand Settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
