'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type WishlistItem = {
  _id: string;
  product_id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  } | null;
};

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.push('/login?next=' + encodeURIComponent('/wishlist'));
        return;
      }

      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setItems([]);
        return;
      }

      const next: WishlistItem[] = Array.isArray(json?.data?.items) ? json.data.items : [];
      setItems(next.filter((i) => i && typeof i._id === 'string'));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.push('/login?next=' + encodeURIComponent('/wishlist'));
        return;
      }

      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) return;
      window.dispatchEvent(new Event('wishlist:changed'));
      void fetchWishlist();
    } catch {}
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="max-w-md mx-auto">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black mb-4">Your wishlist is empty</h1>
            <p className="text-gray-600 mb-8">Save items you love so you can come back to them.</p>
            <Link href="/products" className="luxury-button">
              Browse Collections
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-black mb-8">Wishlist ({items.length})</h1>
        <div className="space-y-6">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item._id} className="flex items-center space-x-4 p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <Link href={`/products/${product._id}`} className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product._id}`} className="block text-lg font-semibold text-black mb-1 hover:underline">
                    {product.name}
                  </Link>
                  <div className="text-lg font-semibold text-black">{formatPrice(product.price)}</div>
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-8">
          <Link href="/products" className="text-black hover:text-gray-700 transition-colors">
            ← Continue Shopping
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

