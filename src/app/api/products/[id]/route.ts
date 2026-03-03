import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Product } from '@/types';
import { ObjectId } from 'mongodb';
import { supabase } from '@/lib/supabase';

type MongoProduct = Omit<Product, '_id'> & { _id: ObjectId };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown, maxLen: number) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  if (s.length > maxLen) return null;
  return s;
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function normalizeInteger(value: unknown) {
  const n = normalizeNumber(value);
  if (n === null) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}

function normalizeStringArray(value: unknown, min: number, max: number, itemMaxLen: number) {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((v) => normalizeString(v, itemMaxLen))
    .filter((v): v is string => Boolean(v));
  if (items.length < min || items.length > max) return null;
  return items;
}

async function getEmailFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.email || null;
}

async function isAdminEmail(email: string) {
  const adminsEnv = process.env.ADMIN_EMAILS || '';
  const adminList = adminsEnv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminList.includes(email.toLowerCase())) return true;

  const client = await clientPromise;
  const db = client.db('luxury-ecommerce');
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  return user?.role === 'admin';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin') === '1';

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    if (admin) {
      const email = await getEmailFromRequest(request);
      if (!email) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const isAdmin = await isAdminEmail(email);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const product = await db
      .collection<MongoProduct>('products')
      .findOne({ _id: new ObjectId(id), ...(admin ? {} : { is_active: true }) });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const normalizedProduct: Product = { ...product, _id: product._id.toString() };

    return NextResponse.json({
      success: true,
      data: normalizedProduct,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const email = await getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if ('name' in body) {
      const name = normalizeString(body.name, 120);
      if (!name) return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
      update.name = name;
    }
    if ('description' in body) {
      const description = normalizeString(body.description, 5000);
      if (!description || description.length < 10) {
        return NextResponse.json({ success: false, error: 'Invalid description' }, { status: 400 });
      }
      update.description = description;
    }
    if ('category' in body) {
      const category = normalizeString(body.category, 64);
      if (!category) return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 });
      update.category = category;
    }
    if ('images' in body) {
      const images = normalizeStringArray(body.images, 1, 10, 2048);
      if (!images) return NextResponse.json({ success: false, error: 'Invalid images' }, { status: 400 });
      update.images = images;
    }
    if ('sizes' in body) {
      const sizes = normalizeStringArray(body.sizes, 1, 20, 32);
      if (!sizes) return NextResponse.json({ success: false, error: 'Invalid sizes' }, { status: 400 });
      update.sizes = sizes;
    }
    if ('price' in body) {
      const price = normalizeNumber(body.price);
      if (price === null || price <= 0 || price > 1000000) {
        return NextResponse.json({ success: false, error: 'Invalid price' }, { status: 400 });
      }
      update.price = price;
    }
    if ('compare_at_price' in body) {
      if (body.compare_at_price === null) {
        update.compare_at_price = null;
      } else {
        const compareAtPrice = normalizeNumber(body.compare_at_price);
        if (compareAtPrice === null || compareAtPrice <= 0 || compareAtPrice > 1000000) {
          return NextResponse.json(
            { success: false, error: 'Invalid compare_at_price' },
            { status: 400 }
          );
        }
        update.compare_at_price = compareAtPrice;
      }
    }
    if ('inventory' in body) {
      const inventory = normalizeInteger(body.inventory);
      if (inventory === null || inventory < 0 || inventory > 1000000) {
        return NextResponse.json({ success: false, error: 'Invalid inventory' }, { status: 400 });
      }
      update.inventory = inventory;
    }
    if ('is_active' in body) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ success: false, error: 'Invalid is_active' }, { status: 400 });
      }
      update.is_active = body.is_active;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updated_at: new Date() } }
    );

    const updated = await db
      .collection<MongoProduct>('products')
      .findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const normalized: Product = { ...updated, _id: updated._id.toString() };
    return NextResponse.json({ success: true, data: normalized });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const email = await getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const result = await db
      .collection('products')
      .updateOne({ _id: new ObjectId(id) }, { $set: { is_active: false, updated_at: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
