import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import { ObjectId } from 'mongodb';

type CartItemAggregate = {
  product?: { price?: number | string };
  quantity?: number;
};

async function getUserIdFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

// Get cart for user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    const cart = await db
      .collection('carts')
      .findOne({ user_id: userId });

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: { items: [], total: 0 },
      });
    }

    // Get cart items with product details
    const cartItems = (await db
      .collection('cart_items')
      .aggregate([
        { $match: { cart_id: cart._id } },
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
            quantity: 1,
            size: 1,
            product: 1,
          },
        },
      ])
      .toArray()) as CartItemAggregate[];

    const total = cartItems.reduce((sum, item) => {
      return sum + Number(item?.product?.price || 0) * Number(item?.quantity || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        total,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId, quantity, size } = await request.json();

    if (!productId || !size || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    // Find or create cart
    let cart = await db
      .collection('carts')
      .findOne({ user_id: userId });

    if (!cart) {
      const result = await db.collection('carts').insertOne({
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });
      cart = await db.collection('carts').findOne({ _id: result.insertedId });
    }
    if (!cart) {
      return NextResponse.json({ success: false, error: 'Cart creation failed' }, { status: 500 });
    }

    // Check if item already exists in cart
    const existingItem = await db
      .collection('cart_items')
      .findOne({
        cart_id: cart._id,
        product_id: new ObjectId(productId),
        size,
      });

    if (existingItem) {
      // Update quantity
      await db.collection('cart_items').updateOne(
        { _id: existingItem._id },
        { $inc: { quantity } }
      );
    } else {
      // Add new item
      await db.collection('cart_items').insertOne({
        cart_id: cart._id,
        product_id: new ObjectId(productId),
        quantity,
        size,
      });
    }

    // Update cart timestamp
    await db.collection('carts').updateOne(
      { _id: cart._id },
      { $set: { updated_at: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemId, quantity } = await request.json();

    if (!itemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid item ID or quantity' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    // Get cart for user
    const cart = await db
      .collection('carts')
      .findOne({ user_id: userId });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Update cart item quantity
    const result = await db.collection('cart_items').updateOne(
      { 
        _id: new ObjectId(itemId),
        cart_id: cart._id 
      },
      { $set: { quantity } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    // Update cart timestamp
    await db.collection('carts').updateOne(
      { _id: cart._id },
      { $set: { updated_at: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Cart item updated',
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing item ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    // Get cart for user
    const cart = await db
      .collection('carts')
      .findOne({ user_id: userId });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Remove cart item
    const result = await db.collection('cart_items').deleteOne({
      _id: new ObjectId(itemId),
      cart_id: cart._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    // Update cart timestamp
    await db.collection('carts').updateOne(
      { _id: cart._id },
      { $set: { updated_at: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Delete cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
