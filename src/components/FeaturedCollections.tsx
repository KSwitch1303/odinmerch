'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type FeaturedCollection = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
};

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  images: string[];
  inventory: number;
};

type FeaturedSection = {
  collection: FeaturedCollection;
  products: Product[];
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

export default function FeaturedCollections() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sections, setSections] = useState<FeaturedSection[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/collections?featured=1', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(String(json?.error || 'Failed to load collections'));
        const list = Array.isArray(json.data) ? (json.data as FeaturedCollection[]) : [];

        const nextSections = await Promise.all(
          list.map(async (collection) => {
            try {
              const params = new URLSearchParams();
              params.set('category', collection.slug);
              params.set('page', '1');
              params.set('limit', '4');
              const productsRes = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
              const productsJson = await productsRes.json().catch(() => null);
              const products = Array.isArray(productsJson?.data?.products)
                ? (productsJson.data.products as Product[])
                : [];
              return { collection, products };
            } catch {
              return { collection, products: [] };
            }
          })
        );

        if (cancelled) return;
        setSections(nextSections);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load collections');
        setSections([]);
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

  const blocks = useMemo(() => {
    return sections.map((s) => {
      const href = `/products?category=${encodeURIComponent(s.collection.slug)}`;
      return { ...s, href };
    });
  }, [sections]);

  return (
    <section className="pt-12 sm:pt-16 lg:pt-20 pb-24 sm:pb-28 lg:pb-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold luxury-heading text-black">
            Featured Collections
          </h2>
          <p className="mt-3 text-sm sm:text-lg text-gray-600 max-w-2xl">
            Explore the drops we’re highlighting right now.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Loading collections...</div>
        ) : error ? (
          <div className="text-center text-red-700">{error}</div>
        ) : blocks.length === 0 ? (
          <div className="text-center text-gray-600">No featured collections yet.</div>
        ) : (
          <div className="space-y-12 sm:space-y-14">
            {blocks.map(({ collection, products, href }) => (
              <div key={collection._id} className="rounded-2xl bg-white p-5 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-semibold luxury-heading text-black">
                      {collection.name}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
                      {collection.description || 'A curated selection of the latest pieces.'}
                    </p>
                  </div>
                  <Link
                    href={href}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-black px-4 py-2 text-sm font-medium text-black"
                  >
                    View collection
                  </Link>
                </div>

                {products.length === 0 ? (
                  <div className="text-gray-600">No products in this collection yet.</div>
                ) : (
                  <>
                    <div className="sm:hidden -mx-5 px-5 overflow-x-auto snap-x snap-mandatory">
                      <div className="flex gap-4 pb-2">
                        {products.map((product) => (
                          <Link
                            key={product._id}
                            href={`/products/${product._id}`}
                            className="group block w-[78%] max-w-[18rem] shrink-0 snap-start"
                          >
                            <div className="overflow-hidden rounded-xl bg-white border border-neutral-200">
                              <div className="aspect-[4/5] relative overflow-hidden">
                                {typeof product.compare_at_price === 'number' &&
                                product.compare_at_price > product.price ? (
                                  <div className="absolute left-3 top-3 z-10 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                                    -
                                    {Math.round(
                                      ((product.compare_at_price - product.price) / product.compare_at_price) * 100
                                    )}
                                    %
                                  </div>
                                ) : null}
                                <Image
                                  src={cleanImageSrc(product.images?.[0]) || '/placeholder-product.jpg'}
                                  alt={product.name}
                                  fill
                                  className="object-cover group-active:scale-105 transition-transform duration-300"
                                />
                              </div>

                              <div className="p-4">
                                <h4 className="text-base font-semibold luxury-heading text-black line-clamp-2">
                                  {product.name}
                                </h4>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <span className="text-base font-bold text-black">{formatPrice(product.price)}</span>
                                  {product.inventory === 0 ? (
                                    <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                                  ) : product.inventory < 5 ? (
                                    <span className="text-xs text-amber-600 font-medium">Low Stock</span>
                                  ) : (
                                    <span className="text-xs text-green-600 font-medium">In Stock</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                      {products.map((product) => (
                        <Link key={product._id} href={`/products/${product._id}`} className="group block">
                          <div className="relative overflow-hidden rounded-xl bg-white border border-neutral-200 hover:shadow-xl transition-all duration-300">
                            <div className="aspect-[3/4] relative overflow-hidden">
                              {typeof product.compare_at_price === 'number' &&
                              product.compare_at_price > product.price ? (
                                <div className="absolute left-4 top-4 z-10 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                                  -
                                  {Math.round(
                                    ((product.compare_at_price - product.price) / product.compare_at_price) * 100
                                  )}
                                  %
                                </div>
                              ) : null}
                              <Image
                                src={cleanImageSrc(product.images?.[0]) || '/placeholder-product.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="p-5">
                              <h4 className="text-lg font-semibold luxury-heading text-black mb-2 line-clamp-2">
                                {product.name}
                              </h4>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-black">{formatPrice(product.price)}</span>
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10 sm:mt-12">
          <Link href="/products" className="luxury-button-outline">
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
}
