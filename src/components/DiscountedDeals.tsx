'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  images: string[];
  inventory: number;
};

function cleanImageSrc(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[)\]]+$/g, '');
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export default function DiscountedDeals() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('discounted', '1');
        params.set('page', '1');
        params.set('limit', '8');
        const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(String(json?.error || 'Failed to load deals'));
        const next = Array.isArray(json?.data?.products) ? (json.data.products as Product[]) : [];
        if (cancelled) return;
        setItems(next);
      } catch {
        if (cancelled) return;
        setItems([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const deals = useMemo(() => {
    return items
      .map((p) => {
        const compareAt = typeof p.compare_at_price === 'number' ? p.compare_at_price : null;
        const hasDiscount = compareAt !== null && compareAt > p.price;
        const discountPercent = hasDiscount ? Math.round(((compareAt - p.price) / compareAt) * 100) : 0;
        return { ...p, compareAt, hasDiscount, discountPercent };
      })
      .filter((p) => p.hasDiscount);
  }, [items]);

  const maxDiscount = useMemo(() => {
    return deals.reduce((acc, p) => Math.max(acc, p.discountPercent), 0);
  }, [deals]);

  if (loading) return null;
  if (deals.length === 0) return null;

  return (
    <section className="min-h-screen">
      <div className="min-h-screen bg-white shadow-[0_-18px_40px_rgba(0,0,0,0.12)] flex">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-h-screen py-14 sm:py-16 lg:py-20 flex"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex">
            <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-white w-full flex flex-col">
              <div className="bg-neutral-950">
                <div className="px-6 py-10 sm:px-10 sm:py-12">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/85">
                        <span>Discounted Deals</span>
                        <span className="h-1 w-1 rounded-full bg-white/35" />
                        <span>Up to {maxDiscount}% off</span>
                      </div>
                      <h2 className="mt-4 text-3xl sm:text-5xl font-bold luxury-heading text-white">
                        Limited-time markdowns
                      </h2>
                      <p className="mt-3 text-sm sm:text-lg text-white/70 max-w-2xl">
                        {deals.length} {deals.length === 1 ? 'item' : 'items'} currently discounted. When they’re gone,
                        they’re gone.
                      </p>
                    </div>
                    <Link
                      href="/products"
                      className="inline-flex w-full lg:w-auto items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90 transition-colors"
                    >
                      Shop all
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 flex-1">
                <div className="h-full px-5 sm:px-8 py-8 sm:py-10 flex items-center">
                  <div className="-mx-5 sm:-mx-8 px-5 sm:px-8 overflow-x-auto snap-x snap-mandatory">
                    <div className="flex gap-4 sm:gap-6 pb-2">
                      {deals
                        .slice()
                        .sort((a, b) => b.discountPercent - a.discountPercent)
                        .map((product) => (
                          <Link
                            key={product._id}
                            href={`/products/${product._id}`}
                            className="group block w-[86%] max-w-[22rem] shrink-0 snap-start"
                          >
                            <div className="overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300">
                              <div className="flex">
                                <div className="relative h-36 w-36 sm:h-40 sm:w-40 overflow-hidden bg-gray-100">
                                  <Image
                                    src={cleanImageSrc(product.images?.[0]) || '/placeholder-product.jpg'}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                                    -{product.discountPercent}%
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1 p-4 sm:p-5">
                                  <h3 className="text-base sm:text-lg font-semibold luxury-heading text-black line-clamp-2">
                                    {product.name}
                                  </h3>
                                  <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    {product.description}
                                  </p>

                                  <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-lg sm:text-xl font-bold text-black">
                                      {formatPrice(product.price)}
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-500 line-through truncate">
                                      {formatPrice(product.compareAt as number)}
                                    </span>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-3">
                                    {product.inventory === 0 ? (
                                      <span className="text-xs sm:text-sm text-red-600 font-medium">Out of Stock</span>
                                    ) : product.inventory < 5 ? (
                                      <span className="text-xs sm:text-sm text-amber-600 font-medium">Low Stock</span>
                                    ) : (
                                      <span className="text-xs sm:text-sm text-green-600 font-medium">In Stock</span>
                                    )}
                                    <span className="text-xs font-medium text-black/70 whitespace-nowrap">View</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
