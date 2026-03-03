'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';

type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  firstOrderAt: string;
  lastOrderAt: string;
  ordersCount: number;
  totalSpent: number;
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');

  const [expandedId, setExpandedId] = useState<string>('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('customers', '1');
    params.set('page', String(page));
    params.set('limit', '20');
    if (q.trim()) params.set('q', q.trim());
    return params.toString();
  }, [page, q]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setCustomers([]);
        setError('You must be logged in as an admin.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/orders?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setCustomers([]);
        setError(String(json?.error || 'Failed to load customers.'));
        setLoading(false);
        return;
      }

      const list = Array.isArray(json?.data?.customers) ? (json.data.customers as Customer[]) : [];
      setCustomers(list);
      setPage(Number(json?.data?.pagination?.page || 1));
      setPages(Number(json?.data?.pagination?.pages || 1));
      setTotal(Number(json?.data?.pagination?.total || 0));
    } catch {
      setCustomers([]);
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setExpandedId('');
    setPage(1);
    setQ(qInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-black">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-black">Customers</h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading…' : `${total} customer${total === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={onSubmitSearch} className="flex gap-3">
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="w-full sm:w-80 border border-neutral-300 bg-white text-black placeholder:text-gray-400 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Search email, name, phone"
            />
            <button type="submit" className="px-5 py-3 bg-black text-white tracking-wider uppercase text-sm">
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() => void fetchCustomers()}
            className="px-4 py-3 border border-neutral-300 bg-white text-black hover:border-black transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 border border-red-200 bg-red-50 text-red-800 px-4 py-3">{error}</div>
      ) : null}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <p className="text-gray-700">No customers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const created = c.firstOrderAt ? new Date(c.firstOrderAt) : null;
            const last = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
            const isExpanded = expandedId === c.id;
            const location = [c.city, c.state, c.country].filter(Boolean).join(', ');
            const addressLine = [c.address, c.zipCode].filter(Boolean).join(' ');

            return (
              <div key={c.id} className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-black">{c.name || 'Customer'}</p>
                        <span className="text-xs text-gray-500">{c.email}</span>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-black">{c.ordersCount}</span> order{c.ordersCount === 1 ? '' : 's'}
                          <span className="text-gray-500">{` • ${formatPrice(Number(c.totalSpent || 0))}`}</span>
                        </p>
                        {c.phone ? <p className="text-sm text-gray-500">{c.phone}</p> : null}
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        {location ? <p className="text-xs text-gray-500">{location}</p> : null}
                        {last ? <p className="text-xs text-gray-500">Last order: {last.toLocaleString()}</p> : null}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(c.email)}`}
                        className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Orders
                      </Link>
                      <button
                        type="button"
                        onClick={() => setExpandedId((prev) => (prev === c.id ? '' : c.id))}
                        className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm flex items-center gap-2"
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
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-neutral-200 bg-gray-50 px-4 sm:px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-neutral-200 rounded p-4 space-y-2">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-black">Email:</span> {c.email}
                        </p>
                        {c.phone ? (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-black">Phone:</span> {c.phone}
                          </p>
                        ) : null}
                        {addressLine ? (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-black">Address:</span> {addressLine}
                          </p>
                        ) : null}
                        {location ? (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-black">Location:</span> {location}
                          </p>
                        ) : null}
                      </div>

                      <div className="bg-white border border-neutral-200 rounded p-4 space-y-2">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-black">Orders:</span> {c.ordersCount}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-black">Total spent:</span> {formatPrice(Number(c.totalSpent || 0))}
                        </p>
                        {created ? (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-black">First order:</span> {created.toLocaleString()}
                          </p>
                        ) : null}
                        {last ? (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-black">Last order:</span> {last.toLocaleString()}
                          </p>
                        ) : null}
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
