import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import { Db, ObjectId } from 'mongodb';

async function getUserIdFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

type WishlistItemAggregate = {
  _id: ObjectId;
  product_id: ObjectId;
  created_at?: Date;
  product?: {
    _id: ObjectId;
    name?: string;
    price?: number;
    compare_at_price?: number | null;
    images?: string[];
  };
};

async function ensureWishlist(db: Db, userId: string) {
  const existing = await db.collection('wishlists').findOne({ user_id: userId });
  if (existing) return existing;
  const result = await db.collection('wishlists').insertOne({
    user_id: userId,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return db.collection('wishlists').findOne({ _id: result.insertedId });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');

    const wishlist = await ensureWishlist(db, userId);
    if (!wishlist) {
      return NextResponse.json({ success: false, error: 'Wishlist creation failed' }, { status: 500 });
    }

    if (productId) {
      if (!ObjectId.isValid(productId)) {
        return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
      }
      const found = await db.collection('wishlist_items').findOne({
        wishlist_id: wishlist._id,
        product_id: new ObjectId(productId),
      });
      return NextResponse.json({ success: true, data: { inWishlist: Boolean(found) } });
    }

    const items = (await db
      .collection('wishlist_items')
      .aggregate([
        { $match: { wishlist_id: wishlist._id } },
        { $sort: { created_at: -1, _id: -1 } },
        {
          $lookup: {
            from: 'products',
            localField: 'product_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: 1,
            product_id: 1,
            created_at: 1,
            product: 1,
          },
        },
      ])
      .toArray()) as WishlistItemAggregate[];

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((i) => ({
          _id: String(i._id),
          product_id: String(i.product_id),
          created_at: i.created_at || null,
          product: i.product
            ? {
                _id: String(i.product._id),
                name: String(i.product.name || ''),
                price: Number(i.product.price || 0),
                compare_at_price:
                  typeof i.product.compare_at_price === 'number' ? i.product.compare_at_price : null,
                images: Array.isArray(i.product.images)
                  ? i.product.images.filter((v) => typeof v === 'string')
                  : [],
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const productId = body?.productId;
    if (typeof productId !== 'string' || !ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const wishlist = await ensureWishlist(db, userId);
    if (!wishlist) {
      return NextResponse.json({ success: false, error: 'Wishlist creation failed' }, { status: 500 });
    }

    const existing = await db.collection('wishlist_items').findOne({
      wishlist_id: wishlist._id,
      product_id: new ObjectId(productId),
    });

    if (!existing) {
      await db.collection('wishlist_items').insertOne({
        wishlist_id: wishlist._id,
        product_id: new ObjectId(productId),
        created_at: new Date(),
      });
      await db.collection('wishlists').updateOne(
        { _id: wishlist._id },
        { $set: { updated_at: new Date() } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const itemId = typeof body?.itemId === 'string' ? body.itemId : null;
    const productId = typeof body?.productId === 'string' ? body.productId : null;

    if (!itemId && !productId) {
      return NextResponse.json({ success: false, error: 'Missing itemId or productId' }, { status: 400 });
    }

    if (itemId && !ObjectId.isValid(itemId)) {
      return NextResponse.json({ success: false, error: 'Invalid item ID' }, { status: 400 });
    }
    if (productId && !ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const wishlist = await db.collection('wishlists').findOne({ user_id: userId });
    if (!wishlist) {
      return NextResponse.json({ success: true });
    }

    const filter: Record<string, unknown> = { wishlist_id: wishlist._id };
    if (itemId) filter._id = new ObjectId(itemId);
    if (productId) filter.product_id = new ObjectId(productId);

    await db.collection('wishlist_items').deleteOne(filter);
    await db.collection('wishlists').updateOne(
      { _id: wishlist._id },
      { $set: { updated_at: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove wishlist item error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
