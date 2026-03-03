import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const admin = searchParams.get('admin') === '1';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

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

      const query: { category?: string } = {};
      if (category) {
        query.category = category;
      }

      const adminLimit = Math.min(Math.max(parseInt(searchParams.get('limit') || '200'), 1), 500);
      const products = await db
        .collection<Product>('products')
        .find(query)
        .sort({ created_at: -1 })
        .limit(adminLimit)
        .toArray();

      return NextResponse.json({
        success: true,
        data: {
          products,
        },
      });
    }

    const query: { is_active: boolean; category?: string } = { is_active: true };
    if (category) {
      query.category = category;
    }

    const products = await db
      .collection<Product>('products')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('products').countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const name = normalizeString(body.name, 120);
    const description = normalizeString(body.description, 5000);
    const category = normalizeString(body.category, 64);
    const images = normalizeStringArray(body.images, 1, 10, 2048);
    const sizes = normalizeStringArray(body.sizes, 1, 20, 32);
    const price = normalizeNumber(body.price);
    const inventory = normalizeInteger(body.inventory);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
    }
    if (!description || description.length < 10) {
      return NextResponse.json({ success: false, error: 'Invalid description' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 });
    }
    if (!images) {
      return NextResponse.json({ success: false, error: 'Invalid images' }, { status: 400 });
    }
    if (!sizes) {
      return NextResponse.json({ success: false, error: 'Invalid sizes' }, { status: 400 });
    }
    if (price === null || price <= 0 || price > 1000000) {
      return NextResponse.json({ success: false, error: 'Invalid price' }, { status: 400 });
    }
    if (inventory === null || inventory < 0 || inventory > 1000000) {
      return NextResponse.json({ success: false, error: 'Invalid inventory' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    const newProduct: Omit<Product, '_id'> = {
      name,
      description,
      price,
      category,
      images,
      sizes,
      inventory,
      is_active: true,
      created_at: new Date(),
    };

    const result = await db.collection('products').insertOne(newProduct);

    return NextResponse.json({
      success: true,
      data: {
        ...newProduct,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
