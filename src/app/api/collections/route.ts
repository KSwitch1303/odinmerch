import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import { ObjectId } from 'mongodb';

type CollectionDoc = {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  is_featured?: boolean;
  created_at: Date;
  updated_at: Date;
};

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

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
    const featuredOnly = searchParams.get('featured') === '1';

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');

    type CollectionAggRow = Pick<CollectionDoc, '_id' | 'name' | 'slug' | 'description' | 'is_featured'> & {
      productCount?: number;
    };

    const collections = await db
      .collection<CollectionDoc>('collections')
      .aggregate<CollectionAggRow>([
        ...(featuredOnly ? [{ $match: { is_featured: true } }] : []),
        {
          $lookup: {
            from: 'products',
            let: { collectionSlug: '$slug' },
            pipeline: [
              { $match: { $expr: { $eq: ['$category', '$$collectionSlug'] } } },
              { $count: 'count' },
            ],
            as: 'productCounts',
          },
        },
        {
          $addFields: {
            productCount: { $ifNull: [{ $arrayElemAt: ['$productCounts.count', 0] }, 0] },
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            description: 1,
            is_featured: 1,
            productCount: 1,
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: collections.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        is_featured: Boolean(c.is_featured),
        productCount: Number(c.productCount || 0),
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const name = normalizeString(body.name, 120);
    const description = normalizeString(body.description, 2000) || '';
    if (!name) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
    }

    const slug = normalizeString(body.slug, 80) || slugify(name);
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Invalid slug' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');

    const existing = await db.collection<CollectionDoc>('collections').findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Collection already exists' }, { status: 409 });
    }

    const now = new Date();
    const doc: Omit<CollectionDoc, '_id'> = {
      name,
      slug,
      description,
      is_featured: false,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection('collections').insertOne(doc);
    return NextResponse.json({
      success: true,
      data: { ...doc, _id: result.insertedId.toString() },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');

    const collection = await db.collection<CollectionDoc>('collections').findOne({ _id: new ObjectId(id) });
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const used = await db.collection('products').countDocuments({ category: collection.slug });
    if (used > 0) {
      return NextResponse.json(
        { success: false, error: 'Collection has products' },
        { status: 409 }
      );
    }

    await db.collection('collections').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
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

    const isFeaturedRaw = body.is_featured;
    if (typeof isFeaturedRaw !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid is_featured' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const now = new Date();

    const result = await db.collection<CollectionDoc>('collections').updateOne(
      { _id: new ObjectId(id) },
      { $set: { is_featured: isFeaturedRaw, updated_at: now } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
