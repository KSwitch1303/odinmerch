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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold luxury-heading text-black mb-4">
            Featured Collections
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
          <div className="space-y-14">
            {blocks.map(({ collection, products, href }) => (
              <div key={collection._id}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-semibold luxury-heading text-black">{collection.name}</h3>
                    <p className="mt-2 text-gray-600 max-w-3xl">
                      {collection.description || 'A curated selection of the latest pieces.'}
                    </p>
                  </div>
                  <Link
                    href={href}
                    className="inline-flex text-sm font-medium text-black underline underline-offset-4"
                  >
                    View collection
                  </Link>
                </div>

                {products.length === 0 ? (
                  <div className="text-gray-600">No products in this collection yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                      <Link key={product._id} href={`/products/${product._id}`} className="group block">
                        <div className="relative overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                          <div className="aspect-[3/4] relative overflow-hidden">
                            <Image
                              src={cleanImageSrc(product.images?.[0]) || '/placeholder-product.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          <div className="p-6">
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
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/products" className="luxury-button-outline">
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
}
