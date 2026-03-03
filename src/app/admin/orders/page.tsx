'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

type Product = {
  _id: string;
  name: string;
  images: string[];
};

type OrderItem = {
  _id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string;
  product?: Product;
};

type Order = {
  _id: string;
  user_id: string;
  items: OrderItem[];
  status: OrderStatus;
  shipping_address?: Record<string, unknown> | null;
  total_amount: number;
  payment_method?: string;
  created_at: string | Date;
  updated_at: string | Date;
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

function statusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function cleanImageSrc(src: string | undefined) {
  if (!src) return '';
  return src.trim().replace(/[)\]]$/, '');
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState('');
  const [error, setError] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [expandedId, setExpandedId] = useState<string>('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('admin', '1');
    params.set('page', String(page));
    params.set('limit', '20');
    if (status !== 'all') params.set('status', status);
    if (q.trim()) params.set('q', q.trim());
    return params.toString();
  }, [page, q, status]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be logged in as an admin.');
        setOrders([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/orders?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(String(json?.error || 'Failed to load orders.'));
        setOrders([]);
        setLoading(false);
        return;
      }
      const list = Array.isArray(json?.data?.orders) ? (json.data.orders as Order[]) : [];
      setOrders(list);
      setPage(Number(json?.data?.pagination?.page || 1));
      setPages(Number(json?.data?.pagination?.pages || 1));
      setTotal(Number(json?.data?.pagination?.total || 0));
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchOrders();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryString]);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setBusyOrderId(orderId);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be logged in as an admin.');
        setBusyOrderId('');
        return;
      }

      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(String(json?.error || 'Failed to update order.'));
        setBusyOrderId('');
        return;
      }
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o)));
    } catch {
      setError('Failed to update order.');
    } finally {
      setBusyOrderId('');
    }
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchOrders();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-black">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-black">Orders</h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading…' : `${total} order${total === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={onSubmitSearch} className="flex gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-80 border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Search email, name, phone, or order id"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-black text-white tracking-wider uppercase text-sm"
            >
              Search
            </button>
          </form>

          <select
            value={status}
            onChange={(e) => {
              const value = e.target.value as OrderStatus | 'all';
              setStatus(value);
              setPage(1);
            }}
            className="w-full sm:w-56 border border-neutral-300 bg-white text-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="px-4 py-3 border border-neutral-300 bg-white text-black hover:border-black transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 border border-red-200 bg-red-50 text-red-800 px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <p className="text-gray-700">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const ship =
              order.shipping_address && typeof order.shipping_address === 'object'
                ? order.shipping_address
                : {};
            const getShipString = (key: string) => {
              const value = ship[key];
              return typeof value === 'string' ? value : '';
            };
            const email = getShipString('email');
            const firstName = getShipString('firstName');
            const lastName = getShipString('lastName');
            const phone = getShipString('phone') || getShipString('phoneNumber');
            const name = `${firstName} ${lastName}`.trim();
            const created = order.created_at ? new Date(order.created_at) : null;
            const itemCount = (order.items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
            const isExpanded = expandedId === order._id;
            const canEdit = busyOrderId !== '' ? busyOrderId === order._id : true;

            return (
              <div key={order._id} className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-black">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {created ? created.toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <p className="text-sm text-gray-700 truncate">
                          {name || 'Customer'}{email ? ` • ${email}` : ''}
                        </p>
                        {phone ? <p className="text-sm text-gray-500">{phone}</p> : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId((prev) => (prev === order._id ? '' : order._id))}
                      className="shrink-0 px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm flex items-center gap-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Details
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-black">{formatPrice(Number(order.total_amount || 0))}</span>
                        <span className="text-gray-500">{` • ${itemCount} item${itemCount === 1 ? '' : 's'}`}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={order.status}
                        disabled={!canEdit || busyOrderId === order._id}
                        onChange={(e) => void updateStatus(order._id, e.target.value as OrderStatus)}
                        className="border border-neutral-300 bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {busyOrderId === order._id ? (
                        <span className="text-sm text-gray-500">Saving…</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-neutral-200 bg-gray-50 px-4 sm:px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-black">Items</h3>
                        <div className="space-y-2">
                          {(order.items || []).map((item) => {
                            const productName = item.product?.name || 'Product';
                            const img = cleanImageSrc(item.product?.images?.[0]);
                            return (
                              <div key={item._id} className="flex items-center gap-3 bg-white border border-neutral-200 rounded p-3">
                                <div className="relative h-12 w-12 rounded overflow-hidden bg-gray-100 shrink-0">
                                  {img ? (
                                    <Image src={img} alt={productName} fill className="object-cover" />
                                  ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-black truncate">{productName}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.quantity} × {formatPrice(Number(item.price || 0))}
                                    {item.size ? ` • Size: ${item.size}` : ''}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-black">
                                  {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-black">Shipping</h3>
                        <div className="bg-white border border-neutral-200 rounded p-4 space-y-2">
                          {name || email ? (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium text-black">{name || 'Customer'}</span>
                              {email ? ` • ${email}` : ''}
                            </p>
                          ) : null}
                          {phone ? <p className="text-sm text-gray-700">{phone}</p> : null}
                          <p className="text-sm text-gray-700">
                            {getShipString('address') || getShipString('street')}
                          </p>
                          <p className="text-sm text-gray-700">
                            {[
                              getShipString('city'),
                              getShipString('state'),
                              getShipString('zipCode') || getShipString('zip'),
                              getShipString('country'),
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Payment: {String(order.payment_method || '—')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-4 py-2 border border-neutral-300 bg-white text-black disabled:opacity-50"
        >
          Prev
        </button>
        <p className="text-sm text-gray-600">
          Page <span className="text-black font-medium">{page}</span> of{' '}
          <span className="text-black font-medium">{pages}</span>
        </p>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page >= pages}
          className="px-4 py-2 border border-neutral-300 bg-white text-black disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
