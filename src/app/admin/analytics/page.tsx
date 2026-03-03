'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

type AnalyticsSummary = {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
};

type SeriesPoint = {
  date: string;
  revenue: number;
  orders: number;
};

type StatusRow = {
  status: string;
  count: number;
  revenue: number;
};

type TopProductRow = {
  _id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
};

type CategoryRow = {
  category: string;
  revenue: number;
  sales: number;
};

type AnalyticsData = {
  period: { days: number; start: string; end: string };
  summary: AnalyticsSummary;
  series: SeriesPoint[];
  statusBreakdown: StatusRow[];
  topProducts: TopProductRow[];
  revenueByCategory: CategoryRow[];
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

function growthColor(value: number) {
  if (value > 0) return 'text-green-700 bg-green-50 border-green-200';
  if (value < 0) return 'text-red-700 bg-red-50 border-red-200';
  return 'text-gray-700 bg-gray-50 border-gray-200';
}

function statusBadge(status: string) {
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

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('analytics', '1');
    params.set('days', String(days));
    return params.toString();
  }, [days]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setData(null);
        setError('You must be logged in as an admin.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/orders?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setData(null);
        setError(String(json?.error || 'Failed to load analytics.'));
        setLoading(false);
        return;
      }
      setData(json.data as AnalyticsData);
    } catch {
      setData(null);
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const maxRevenue = useMemo(() => {
    const values = data?.series?.map((p) => Number(p.revenue || 0)) || [];
    return values.length ? Math.max(...values, 0) : 0;
  }, [data?.series]);

  const summary = data?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-black">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-black">Analytics</h1>
          <p className="text-gray-600 mt-1">
            {data ? `Last ${data.period.days} days` : loading ? 'Loading…' : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as 7 | 30 | 90)}
            className="w-full sm:w-56 border border-neutral-300 bg-white text-black px-4 py-3 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            type="button"
            onClick={() => void fetchAnalytics()}
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
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      ) : !data || !summary ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <p className="text-gray-700">No analytics data available.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-neutral-200 bg-white rounded-lg p-5">
              <p className="text-xs tracking-wider uppercase text-gray-500">Revenue</p>
              <p className="text-xl font-semibold text-black mt-2">{formatPrice(Number(summary.revenue || 0))}</p>
              <div className={`inline-flex items-center border px-2.5 py-1 rounded-full text-xs mt-3 ${growthColor(summary.revenueGrowth)}`}>
                {formatPercent(summary.revenueGrowth)}
              </div>
            </div>
            <div className="border border-neutral-200 bg-white rounded-lg p-5">
              <p className="text-xs tracking-wider uppercase text-gray-500">Orders</p>
              <p className="text-xl font-semibold text-black mt-2">{Number(summary.orders || 0)}</p>
              <div className={`inline-flex items-center border px-2.5 py-1 rounded-full text-xs mt-3 ${growthColor(summary.orderGrowth)}`}>
                {formatPercent(summary.orderGrowth)}
              </div>
            </div>
            <div className="border border-neutral-200 bg-white rounded-lg p-5">
              <p className="text-xs tracking-wider uppercase text-gray-500">Customers</p>
              <p className="text-xl font-semibold text-black mt-2">{Number(summary.customers || 0)}</p>
              <div className={`inline-flex items-center border px-2.5 py-1 rounded-full text-xs mt-3 ${growthColor(summary.customerGrowth)}`}>
                {formatPercent(summary.customerGrowth)}
              </div>
            </div>
            <div className="border border-neutral-200 bg-white rounded-lg p-5">
              <p className="text-xs tracking-wider uppercase text-gray-500">Avg Order Value</p>
              <p className="text-xl font-semibold text-black mt-2">{formatPrice(Number(summary.avgOrderValue || 0))}</p>
              <p className="text-xs text-gray-500 mt-3">Based on completed + in-progress orders</p>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Revenue Trend</h2>
              <p className="text-sm text-gray-600">{data.series.length} points</p>
            </div>
            {data.series.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-600">No revenue data for this period.</div>
            ) : (
              <div className="h-56 flex items-end gap-1">
                {data.series.map((p) => {
                  const h = maxRevenue > 0 ? Math.max(2, Math.round((p.revenue / maxRevenue) * 100)) : 2;
                  const label = `${p.date} • ${formatPrice(Number(p.revenue || 0))} • ${p.orders} orders`;
                  return (
                    <div key={p.date} className="flex-1 min-w-0">
                      <div
                        title={label}
                        className="w-full bg-black/80 hover:bg-black transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{data.period.start.slice(0, 10)}</span>
              <span>{data.period.end.slice(0, 10)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-neutral-200 bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Status Breakdown</h2>
              {data.statusBreakdown.length === 0 ? (
                <p className="text-gray-600">No orders in this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.statusBreakdown.map((r) => (
                    <div key={r.status} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge(r.status)}`}>{r.status}</span>
                        <span className="text-sm text-gray-700">{r.count} order{r.count === 1 ? '' : 's'}</span>
                      </div>
                      <div className="text-sm font-semibold text-black">{formatPrice(Number(r.revenue || 0))}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-neutral-200 bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Revenue by Category</h2>
              {data.revenueByCategory.length === 0 ? (
                <p className="text-gray-600">No category data.</p>
              ) : (
                <div className="space-y-3">
                  {data.revenueByCategory.map((r) => (
                    <div key={r.category} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-black truncate">{r.category}</p>
                        <p className="text-xs text-gray-500">{r.sales} item{r.sales === 1 ? '' : 's'} sold</p>
                      </div>
                      <p className="text-sm font-semibold text-black">{formatPrice(Number(r.revenue || 0))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border border-neutral-200 bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Top Products</h2>
            {data.topProducts.length === 0 ? (
              <p className="text-gray-600">No product data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-neutral-200">
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Units</th>
                      <th className="py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p._id} className="border-b border-neutral-100">
                        <td className="py-3 pr-4">
                          <div className="min-w-0">
                            <p className="font-medium text-black truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">{p._id.slice(-8).toUpperCase()}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{p.category || '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{p.sales}</td>
                        <td className="py-3 text-right font-semibold text-black">{formatPrice(Number(p.revenue || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
