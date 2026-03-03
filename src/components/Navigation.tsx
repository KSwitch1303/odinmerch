'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Menu, X, ShoppingBag, User, Heart, LayoutDashboard, Store } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';

type NavigationVariant = 'store' | 'admin';

export default function Navigation({
  variant = 'store',
  hideBrandOnHome = false,
  overlay = false,
}: {
  variant?: NavigationVariant;
  hideBrandOnHome?: boolean;
  overlay?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [brandName, setBrandName] = useState('ODIN');
  const [logoUrl, setLogoUrl] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistHasDiscount, setWishlistHasDiscount] = useState(false);
  const [showBrandInNav, setShowBrandInNav] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          const name = json.businessName || 'ODIN';
          setBrandName(name);
          setLogoUrl(json.logoUrl || '');
          document.title = name;
        }
      } catch {}
    };
    load();
  }, []);

  const navigationItems =
    variant === 'admin'
      ? [
          { name: 'Dashboard', href: '/admin' },
          { name: 'Orders', href: '/admin/orders' },
          { name: 'Products', href: '/admin/products' },
          { name: 'Customers', href: '/admin/customers' },
          { name: 'Content', href: '/admin/content' },
          { name: 'Analytics', href: '/admin/analytics' },
        ]
      : [
          { name: 'Collections', href: '/products' },
          { name: 'New Arrivals', href: '/products?filter=new' },
          { name: 'About', href: '/about' },
          { name: 'Contact', href: '/contact' },
        ];

  const logoHref = variant === 'admin' ? '/admin' : '/';

  const isAdminRoute = (href: string) => {
    if (!href.startsWith('/admin')) return false;
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const isActiveRoute = (href: string) => {
    const baseHref = href.split('?')[0] || href;
    if (baseHref === '/') return pathname === '/';
    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  };

  const fetchCartCount = useCallback(async () => {
    if (variant !== 'store') return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setCartCount(0);
        return;
      }

      const res = await fetch('/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setCartCount(0);
        return;
      }

      type CartItemWithQuantity = { quantity?: number };
      const items: CartItemWithQuantity[] = Array.isArray(json?.data?.items)
        ? (json.data.items as CartItemWithQuantity[])
        : [];
      const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, [variant]);

  const fetchWishlistIndicator = useCallback(async () => {
    if (variant !== 'store') return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setWishlistHasDiscount(false);
        return;
      }

      const res = await fetch('/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setWishlistHasDiscount(false);
        return;
      }

      type WishlistItem = { product?: { price?: number; compare_at_price?: number | null } | null };
      const items: WishlistItem[] = Array.isArray(json?.data?.items) ? json.data.items : [];
      const hasDiscount = items.some((item) => {
        const price = Number(item?.product?.price || 0);
        const compareAt = item?.product?.compare_at_price;
        return typeof compareAt === 'number' && compareAt > price;
      });
      setWishlistHasDiscount(hasDiscount);
    } catch {
      setWishlistHasDiscount(false);
    }
  }, [variant]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCartCount();
      void fetchWishlistIndicator();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchCartCount, fetchWishlistIndicator, pathname, user?.id]);

  useEffect(() => {
    if (variant !== 'store') return;
    const refresh = () => {
      void fetchCartCount();
      void fetchWishlistIndicator();
    };
    window.addEventListener('cart:changed', refresh as EventListener);
    window.addEventListener('wishlist:changed', refresh as EventListener);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('cart:changed', refresh as EventListener);
      window.removeEventListener('wishlist:changed', refresh as EventListener);
      window.removeEventListener('focus', refresh);
    };
  }, [fetchCartCount, fetchWishlistIndicator, variant]);

  useEffect(() => {
    let rafId = 0;

    const setLater = (next: boolean) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setShowBrandInNav(next);
      });
    };

    if (variant !== 'store' || !hideBrandOnHome || pathname !== '/') {
      setLater(true);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setIsAtTop(true);
      });
      return () => {
        cancelAnimationFrame(rafId);
      };
    }

    const onScroll = () => {
      const y = window.scrollY;
      setIsAtTop(y <= 0);
      setShowBrandInNav(y > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [hideBrandOnHome, pathname, variant]);

  const homeNavTransparent = variant === 'store' && hideBrandOnHome && pathname === '/' && isAtTop;
  const homeOverlay = variant === 'store' && overlay && pathname === '/';
  const storeTopLinkClass = homeNavTransparent
    ? 'text-sm uppercase tracking-wider font-medium text-white hover:text-white/80 transition-colors duration-200'
    : 'luxury-nav-link text-sm uppercase tracking-wider';
  const storeTopIconClass = homeNavTransparent
    ? 'text-white hover:text-white/80 transition-colors'
    : 'text-gray-700 hover:text-black transition-colors';

  return (
    <nav
      className={`${homeOverlay ? 'fixed top-0 left-0 right-0' : 'sticky top-0'} z-50 transition-colors duration-300 ${
        homeNavTransparent ? 'bg-transparent border-b-0 shadow-none' : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={logoHref} className="flex-shrink-0 flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
            ) : null}
            <h1
              id="nav-brand-target"
              className={`text-2xl font-bold luxury-heading ${
                homeNavTransparent ? 'text-white' : 'text-black'
              } transition-opacity duration-300 ${
                showBrandInNav ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {brandName}
            </h1>
            {variant === 'admin' ? (
              <span className="hidden sm:inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                Admin
              </span>
            ) : null}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={
                    variant === 'admin' && isAdminRoute(item.href)
                      ? 'luxury-nav-link text-sm uppercase tracking-wider text-black'
                      : storeTopLinkClass
                  }
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side icons */}
          <div className="hidden md:flex items-center space-x-6">
            {variant === 'admin' ? (
              <Link
                href="/"
                className="text-gray-700 hover:text-black transition-colors"
              >
                <Store className="h-5 w-5" />
              </Link>
            ) : (
              <Link href="/wishlist" className={`${storeTopIconClass} relative`} aria-label="Wishlist">
                <Heart className="h-5 w-5" />
                {wishlistHasDiscount ? (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 border border-white" />
                ) : null}
              </Link>
            )}
            <Link
              href={user ? '/account' : `/login?next=${encodeURIComponent(pathname)}`}
              className={`${homeNavTransparent ? storeTopIconClass : user ? 'text-black transition-colors' : storeTopIconClass} relative`}
            >
              <User className="h-5 w-5" />
              {user ? (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 border border-white" />
              ) : null}
            </Link>
            {variant === 'admin' ? (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-black transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/cart"
                className={`${storeTopIconClass} relative`}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={storeTopIconClass}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-200 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        >
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                    variant === 'admin'
                      ? isAdminRoute(item.href)
                        ? 'border-black bg-gray-100 text-black'
                        : 'border-gray-200 bg-white text-black hover:border-black'
                      : isActiveRoute(item.href)
                        ? 'border-black bg-gray-100 text-black'
                        : 'border-gray-200 bg-white text-black hover:border-black'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-3 gap-2">
                {variant === 'admin' ? (
                  <Link
                    href="/"
                    className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-black hover:border-black transition-colors flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Store className="h-5 w-5" />
                    Store
                  </Link>
                ) : (
                  <Link
                    href="/wishlist"
                    className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-black hover:border-black transition-colors flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="relative">
                      <Heart className="h-5 w-5" />
                      {wishlistHasDiscount ? (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                      ) : null}
                    </span>
                    Wishlist
                  </Link>
                )}

                <Link
                  href={user ? '/account' : `/login?next=${encodeURIComponent(pathname)}`}
                  className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-black hover:border-black transition-colors flex items-center justify-center gap-2 relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Account
                  {user ? (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500" />
                  ) : null}
                </Link>

                {variant === 'admin' ? (
                  <Link
                    href="/admin"
                    className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-black hover:border-black transition-colors flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Admin
                  </Link>
                ) : (
                  <Link
                    href="/cart"
                    className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-black hover:border-black transition-colors flex items-center justify-center gap-2 relative"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Cart
                    {cartCount > 0 ? (
                      <span className="absolute top-2 right-2 bg-black text-white text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
