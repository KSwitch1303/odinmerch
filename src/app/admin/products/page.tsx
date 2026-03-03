'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type Collection = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  is_featured?: boolean;
  productCount?: number;
};

type Product = {
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
};

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export default function AdminProductsPage() {
  const [tab, setTab] = useState<'products' | 'collections'>('products');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editRegularPrice, setEditRegularPrice] = useState('');
  const [editDiscountPercent, setEditDiscountPercent] = useState('0');
  const [editInventory, setEditInventory] = useState('0');

  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionSlug, setNewCollectionSlug] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productInventory, setProductInventory] = useState('0');
  const [productSizes, setProductSizes] = useState('One Size');
  const [productCategory, setProductCategory] = useState('');
  const [productFiles, setProductFiles] = useState<File[]>([]);

  const sortedCollections = useMemo(() => {
    const copy = [...collections];
    copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [collections]);

  const productFilePreviews = useMemo(() => {
    return productFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
  }, [productFiles]);

  useEffect(() => {
    return () => {
      productFilePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [productFilePreviews]);

  const fetchCollections = async () => {
    const res = await fetch('/api/collections', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load collections');
    setCollections(json.data || []);
    if (!productCategory && Array.isArray(json.data) && json.data.length > 0) {
      setProductCategory(json.data[0].slug);
    }
  };

  const fetchProducts = async () => {
    const token = await getAccessToken();
    const res = await fetch('/api/products?admin=1&limit=200', {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load products');
    setProducts(json.data?.products || []);
  };

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchCollections(), fetchProducts()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCollection = async () => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newCollectionName,
          slug: newCollectionSlug,
          description: newCollectionDescription,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to create collection');
      setNewCollectionName('');
      setNewCollectionSlug('');
      setNewCollectionDescription('');
      await fetchCollections();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create collection');
    } finally {
      setBusy(false);
    }
  };

  const deleteCollection = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/collections?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to delete collection');
      await fetchCollections();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete collection');
    } finally {
      setBusy(false);
    }
  };

  const setCollectionFeatured = async (collectionId: string, next: boolean) => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/collections?id=${encodeURIComponent(collectionId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_featured: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(String(json?.error || 'Failed to update collection'));
      await fetchCollections();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update collection');
    } finally {
      setBusy(false);
    }
  };

  const toggleProductActive = async (productId: string, next: boolean) => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: next }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to update product');
      await fetchProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update product');
    } finally {
      setBusy(false);
    }
  };

  const startEditProduct = (p: Product) => {
    const regular = typeof p.compare_at_price === 'number' && p.compare_at_price > 0 ? p.compare_at_price : p.price;
    const discount =
      regular > 0 && typeof p.price === 'number' && p.price < regular
        ? Math.round(((regular - p.price) / regular) * 100)
        : 0;
    setEditingProductId(p._id);
    setEditRegularPrice(String(regular));
    setEditDiscountPercent(String(discount));
    setEditInventory(String(p.inventory));
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditRegularPrice('');
    setEditDiscountPercent('0');
    setEditInventory('0');
  };

  const saveProductPricing = async (productId: string) => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Missing session');

      const regular = Number(editRegularPrice);
      const discount = Number(editDiscountPercent);
      const inventory = Number(editInventory);

      if (!Number.isFinite(regular) || regular <= 0) throw new Error('Enter a valid price');
      if (!Number.isFinite(discount) || discount < 0 || discount > 99) throw new Error('Enter a valid discount (0-99)');
      if (!Number.isInteger(inventory) || inventory < 0) throw new Error('Enter a valid inventory');

      const roundPrice = (value: number) => Math.round(value * 100) / 100;

      let nextPrice = regular;
      let compare_at_price: number | null = null;
      if (discount > 0) {
        nextPrice = roundPrice(regular * (1 - discount / 100));
        if (nextPrice <= 0) throw new Error('Discount too high');
        compare_at_price = regular;
      }

      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price: nextPrice,
          compare_at_price,
          inventory,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(String(json?.error || 'Failed to update product'));
      await fetchProducts();
      cancelEditProduct();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update product');
    } finally {
      setBusy(false);
    }
  };

  const archiveProduct = async (productId: string) => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to archive product');
      await fetchProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to archive product');
    } finally {
      setBusy(false);
    }
  };

  const uploadImages = async (files: File[]) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Missing session');
    if (files.length === 0) throw new Error('Select at least one image');
    if (files.length > 10) throw new Error('Max 10 images');

    const uploads = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', 'products');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Upload failed');
        return String(json.data?.url || '');
      })
    );

    const urls = uploads.filter(Boolean);
    if (urls.length === 0) throw new Error('Upload failed');
    return urls;
  };

  const createProduct = async () => {
    setBusy(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Missing session');

      const sizes = productSizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const price = Number(productPrice);
      const inventory = Number(productInventory);

      if (!productCategory) throw new Error('Select a collection');
      if (!productName.trim()) throw new Error('Enter a title');
      if (!productDescription.trim() || productDescription.trim().length < 10) {
        throw new Error('Enter product details (min 10 chars)');
      }
      if (!Number.isFinite(price) || price <= 0) throw new Error('Enter a valid price');
      if (!Number.isInteger(inventory) || inventory < 0) throw new Error('Enter a valid inventory');
      if (sizes.length === 0) throw new Error('Enter at least one size');

      const imageUrls = await uploadImages(productFiles);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productName,
          description: productDescription,
          price,
          category: productCategory,
          images: imageUrls,
          sizes,
          inventory,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to create product');

      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductInventory('0');
      setProductSizes('One Size');
      setProductFiles([]);
      await fetchProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create product');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-black">Products</h1>
          <p className="text-gray-600">Create collections and upload products with multiple images.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <button
            className={`${tab === 'products' ? 'luxury-button' : 'luxury-button-outline'} flex-1 sm:flex-none`}
            onClick={() => setTab('products')}
            type="button"
          >
            Products
          </button>
          <button
            className={`${tab === 'collections' ? 'luxury-button' : 'luxury-button-outline'} flex-1 sm:flex-none`}
            onClick={() => setTab('collections')}
            type="button"
          >
            Collections
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : tab === 'collections' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Create Collection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black placeholder:text-gray-500"
                  placeholder="e.g. Evening Elegance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug (optional)</label>
                <input
                  value={newCollectionSlug}
                  onChange={(e) => setNewCollectionSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black placeholder:text-gray-500"
                  placeholder="e.g. evening"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors min-h-28 text-black placeholder:text-gray-500"
                  placeholder="Short description"
                />
              </div>
              <button
                type="button"
                className="luxury-button w-full disabled:opacity-60"
                onClick={createCollection}
                disabled={busy}
              >
                Create Collection
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Existing Collections</h2>
            {sortedCollections.length === 0 ? (
              <p className="text-gray-600">No collections yet.</p>
            ) : (
              <div className="space-y-3">
                {sortedCollections.map((c) => (
                  <div key={c._id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-black truncate">{c.name}</p>
                      <p className="text-sm text-gray-600 truncate">Slug: {c.slug}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                          {c.is_featured ? 'Featured' : 'Not featured'}
                        </span>
                        {typeof c.productCount === 'number' ? (
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                            {c.productCount} item{c.productCount === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>
                      {c.description ? <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p> : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        className={c.is_featured ? 'luxury-button' : 'luxury-button-outline'}
                        onClick={() => setCollectionFeatured(c._id, !c.is_featured)}
                        disabled={busy}
                      >
                        {c.is_featured ? 'Featured' : 'Set Featured'}
                      </button>
                      <button
                        type="button"
                        className="luxury-button-outline whitespace-nowrap disabled:opacity-60"
                        onClick={() => deleteCollection(c._id)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Create Product</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                  >
                    {sortedCollections.map((c) => (
                      <option key={c._id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                    {sortedCollections.length === 0 ? (
                      <option value="">Create a collection first</option>
                    ) : null}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black placeholder:text-gray-500"
                    placeholder="Product title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black placeholder:text-gray-500"
                    placeholder="e.g. 249.99"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inventory</label>
                  <input
                    value={productInventory}
                    onChange={(e) => setProductInventory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black placeholder:text-gray-500"
                    placeholder="e.g. 10"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (comma separated)</label>
                  <input
                    value={productSizes}
                    onChange={(e) => setProductSizes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black placeholder:text-gray-500"
                    placeholder="e.g. XS, S, M, L, XL"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors min-h-40 text-black placeholder:text-gray-500"
                    placeholder="Product details"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images (max 10)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
                    className="w-full text-black file:text-black file:bg-white file:border file:border-gray-300 file:rounded-md file:px-3 file:py-2 file:mr-3 hover:file:border-black"
                  />
                  {productFilePreviews.length > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {productFilePreviews.map((p) => (
                        <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="luxury-button w-full disabled:opacity-60"
                  onClick={createProduct}
                  disabled={busy || sortedCollections.length === 0}
                >
                  Upload Product
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-black">Existing Products</h2>
              <button
                type="button"
                className="luxury-button-outline disabled:opacity-60"
                onClick={reload}
                disabled={busy}
              >
                Refresh
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-gray-600">No products yet.</p>
            ) : (
              <>
                <div className="sm:hidden space-y-3">
                  {products.map((p) => {
                    const compareAt =
                      typeof p.compare_at_price === 'number' ? p.compare_at_price : null;
                    const hasDiscount = compareAt !== null && compareAt > p.price;
                    const discountPercent = hasDiscount
                      ? Math.round(((compareAt - p.price) / compareAt) * 100)
                      : 0;

                    return (
                      <div key={p._id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            <Image
                              src={p.images?.[0] || '/placeholder-product.jpg'}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-black truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate">{p._id}</p>
                            <p className="mt-1 text-sm text-gray-700">{p.category}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                p.is_active
                                  ? 'border border-gray-200 bg-white text-gray-700'
                                  : 'bg-black text-white'
                              }`}
                            >
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {hasDiscount ? (
                              <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
                                -{discountPercent}%
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {editingProductId === p._id ? (
                          <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Regular price</label>
                                <input
                                  value={editRegularPrice}
                                  onChange={(e) => setEditRegularPrice(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                                  inputMode="decimal"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Discount (%)</label>
                                <input
                                  value={editDiscountPercent}
                                  onChange={(e) => setEditDiscountPercent(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                                  inputMode="numeric"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Inventory</label>
                                <input
                                  value={editInventory}
                                  onChange={(e) => setEditInventory(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                                  inputMode="numeric"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                className="luxury-button w-full disabled:opacity-60"
                                onClick={() => saveProductPricing(p._id)}
                                disabled={busy}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="luxury-button-outline w-full disabled:opacity-60"
                                onClick={cancelEditProduct}
                                disabled={busy}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-base font-semibold text-black">{formatPrice(p.price)}</span>
                                {hasDiscount ? (
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(compareAt as number)}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-gray-700">Stock: {p.inventory}</p>
                            </div>
                            <button
                              type="button"
                              className="luxury-button-outline disabled:opacity-60"
                              onClick={() => startEditProduct(p)}
                              disabled={busy}
                            >
                              Edit
                            </button>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className={p.is_active ? 'luxury-button-outline w-full' : 'luxury-button w-full'}
                            onClick={() => toggleProductActive(p._id, !p.is_active)}
                            disabled={busy}
                          >
                            {p.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="luxury-button-outline w-full disabled:opacity-60"
                            onClick={() => archiveProduct(p._id)}
                            disabled={busy}
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b border-gray-200">
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4">Collection</th>
                        <th className="py-2 pr-4">Price</th>
                        <th className="py-2 pr-4">Discount</th>
                        <th className="py-2 pr-4">Inventory</th>
                        <th className="py-2 pr-4">Active</th>
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p._id} className="border-b border-gray-100">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                <Image
                                  src={p.images?.[0] || '/placeholder-product.jpg'}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-black truncate">{p.name}</p>
                                <p className="text-xs text-gray-500 truncate">{p._id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-800">{p.category}</td>
                          <td className="py-3 pr-4 text-gray-800">
                            {editingProductId === p._id ? (
                              <input
                                value={editRegularPrice}
                                onChange={(e) => setEditRegularPrice(e.target.value)}
                                className="w-32 px-2 py-1 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                                inputMode="decimal"
                              />
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-medium text-black">{formatPrice(p.price)}</span>
                                {typeof p.compare_at_price === 'number' && p.compare_at_price > p.price ? (
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(p.compare_at_price)}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-800">
                            {editingProductId === p._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={editDiscountPercent}
                                  onChange={(e) => setEditDiscountPercent(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                                  inputMode="numeric"
                                />
                                <span className="text-gray-600">%</span>
                              </div>
                            ) : typeof p.compare_at_price === 'number' && p.compare_at_price > p.price ? (
                              <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
                                -{Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)}%
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-800">
                            {editingProductId === p._id ? (
                              <input
                                value={editInventory}
                                onChange={(e) => setEditInventory(e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 focus:border-black focus:outline-none transition-colors text-black"
                                inputMode="numeric"
                              />
                            ) : (
                              p.inventory
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              type="button"
                              className={p.is_active ? 'luxury-button-outline' : 'luxury-button'}
                              onClick={() => toggleProductActive(p._id, !p.is_active)}
                              disabled={busy}
                            >
                              {p.is_active ? 'Yes' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {editingProductId === p._id ? (
                                <>
                                  <button
                                    type="button"
                                    className="luxury-button disabled:opacity-60"
                                    onClick={() => saveProductPricing(p._id)}
                                    disabled={busy}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="luxury-button-outline disabled:opacity-60"
                                    onClick={cancelEditProduct}
                                    disabled={busy}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="luxury-button-outline disabled:opacity-60"
                                  onClick={() => startEditProduct(p)}
                                  disabled={busy}
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                className="luxury-button-outline disabled:opacity-60"
                                onClick={() => archiveProduct(p._id)}
                                disabled={busy}
                              >
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
