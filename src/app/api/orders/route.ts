import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Order, OrderItem, Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { ObjectId, type Filter } from 'mongodb';

type MongoProduct = Omit<Product, '_id'> & { _id: ObjectId };
type MongoOrder = Omit<Order, '_id'> & { _id: ObjectId };

type AuthUser = { id: string; email: string };

async function getAuthUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: String(data.user.email || ''),
  };
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

function growthPercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

type OrderStatus = Order['status'];

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'pending' ||
    value === 'confirmed' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  );
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = authUser.id;

    const { items, shippingAddress, payment_method = 'credit_card', total } = await request.json();

    if (!items || !shippingAddress || total === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    // Create order
    const newOrder: Omit<Order, '_id'> = {
      user_id: userId,
      items: [],
      status: 'pending',
      shipping_address: shippingAddress,
      total_amount: total,
      payment_method,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const orderResult = await db.collection('orders').insertOne(newOrder);
    const orderId = orderResult.insertedId;

    // Create order items
    const orderItems: Omit<OrderItem, '_id'>[] = items.map((item: { productId: string; quantity: number; price: number; size: string }) => ({
      order_id: orderId.toString(),
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
    }));

    await db.collection('order_items').insertMany(orderItems);

    // Update order with items
    await db.collection('orders').updateOne(
      { _id: orderId },
      { 
        $set: { 
          items: orderItems.map(item => ({
            ...item,
            _id: new ObjectId().toString(),
          }))
        } 
      }
    );

    const cart = await db.collection('carts').findOne({ user_id: userId });
    if (cart?._id) {
      await db.collection('cart_items').deleteMany({ cart_id: cart._id });
      await db.collection('carts').deleteOne({ _id: cart._id });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderId.toString(),
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isAdminEmail(authUser.email);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || '');
    const status = body?.status as unknown;

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid orderId' }, { status: 400 });
    }
    if (!isOrderStatus(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const result = await db.collection<MongoOrder>('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, updated_at: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's orders
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');

    const { searchParams } = new URL(request.url);
    const adminDashboard = searchParams.get('adminDashboard') === '1';
    const adminOrders = searchParams.get('admin') === '1';
    const adminCustomers = searchParams.get('customers') === '1';
    const adminAnalytics = searchParams.get('analytics') === '1';
    if (adminDashboard) {
      const isAdmin = await isAdminEmail(authUser.email);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }

      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      const previousStart = new Date(now);
      previousStart.setDate(previousStart.getDate() - 60);

      const orderBaseMatch: Filter<MongoOrder> = {
        status: { $ne: 'cancelled' },
      };

      const totalRevenueAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate([{ $match: orderBaseMatch }, { $group: { _id: null, total: { $sum: '$total_amount' } } }])
        .toArray();
      const totalRevenue = Number(totalRevenueAgg[0]?.total || 0);

      const totalOrders = await db.collection<MongoOrder>('orders').countDocuments(orderBaseMatch);
      const customers = await db.collection<MongoOrder>('orders').distinct('user_id', orderBaseMatch);
      const totalCustomers = Array.isArray(customers) ? customers.length : 0;
      const totalProducts = await db.collection('products').countDocuments({});

      const currentOrderMatch = {
        ...orderBaseMatch,
        created_at: { $gte: currentStart },
      };
      const previousOrderMatch = {
        ...orderBaseMatch,
        created_at: { $gte: previousStart, $lt: currentStart },
      };

      const currentRevenueAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate([{ $match: currentOrderMatch }, { $group: { _id: null, total: { $sum: '$total_amount' } } }])
        .toArray();
      const previousRevenueAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate([{ $match: previousOrderMatch }, { $group: { _id: null, total: { $sum: '$total_amount' } } }])
        .toArray();

      const currentRevenue = Number(currentRevenueAgg[0]?.total || 0);
      const previousRevenue = Number(previousRevenueAgg[0]?.total || 0);
      const currentOrders = await db.collection<MongoOrder>('orders').countDocuments(currentOrderMatch);
      const previousOrders = await db.collection<MongoOrder>('orders').countDocuments(previousOrderMatch);
      const currentCustomers = (await db.collection<MongoOrder>('orders').distinct('user_id', currentOrderMatch)).length;
      const previousCustomers = (await db.collection<MongoOrder>('orders').distinct('user_id', previousOrderMatch)).length;
      const currentProducts = await db.collection('products').countDocuments({ created_at: { $gte: currentStart } });
      const previousProducts = await db
        .collection('products')
        .countDocuments({ created_at: { $gte: previousStart, $lt: currentStart } });

      type TopAggRow = { _id: string; sales: number; revenue: number };
      const topAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate<TopAggRow>([
          { $match: orderBaseMatch },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product_id',
              sales: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ])
        .toArray();

      const topProductIds = topAgg.map((t) => String(t._id)).filter((id) => ObjectId.isValid(id));
      const topProductsDocs = topProductIds.length
        ? await db
            .collection<MongoProduct>('products')
            .find({ _id: { $in: topProductIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : [];
      const topProductById = new Map(
        topProductsDocs.map((p) => {
          const normalized: Product = { ...p, _id: p._id.toString() };
          return [normalized._id, normalized] as const;
        })
      );

      const topProducts = topAgg.map((t) => {
        const productId = String(t._id);
        const product = topProductById.get(productId);
        return {
          _id: productId,
          name: product?.name || 'Unknown Product',
          price: Number(product?.price || 0),
          sales: Number(t.sales || 0),
          revenue: Number(t.revenue || 0),
        };
      });

      const recent = await db
        .collection<MongoOrder>('orders')
        .find(orderBaseMatch)
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();

      const recentOrders = recent.map((o) => ({
        _id: o._id.toString(),
        user_id: String(o.user_id || ''),
        total: Number(o.total_amount || 0),
        status: String(o.status || ''),
        created_at: o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at || ''),
      }));

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            revenueGrowth: growthPercent(currentRevenue, previousRevenue),
            orderGrowth: growthPercent(currentOrders, previousOrders),
            customerGrowth: growthPercent(currentCustomers, previousCustomers),
            productGrowth: growthPercent(currentProducts, previousProducts),
          },
          recentOrders,
          topProducts,
        },
      });
    }

    if (adminAnalytics) {
      const isAdmin = await isAdminEmail(authUser.email);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const daysRaw = Number(searchParams.get('days') || 30);
      const days = Math.min(365, Math.max(1, Number.isFinite(daysRaw) ? Math.floor(daysRaw) : 30));

      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - days);
      const previousStart = new Date(now);
      previousStart.setDate(previousStart.getDate() - days * 2);

      const matchBase: Filter<MongoOrder> = { status: { $ne: 'cancelled' } };
      const currentMatch: Filter<MongoOrder> = { ...matchBase, created_at: { $gte: currentStart } };
      const previousMatch: Filter<MongoOrder> = { ...matchBase, created_at: { $gte: previousStart, $lt: currentStart } };

      const revenueAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate([{ $match: currentMatch }, { $group: { _id: null, total: { $sum: '$total_amount' } } }])
        .toArray();
      const previousRevenueAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate([{ $match: previousMatch }, { $group: { _id: null, total: { $sum: '$total_amount' } } }])
        .toArray();
      const revenue = Number(revenueAgg[0]?.total || 0);
      const previousRevenue = Number(previousRevenueAgg[0]?.total || 0);

      const ordersCount = await db.collection<MongoOrder>('orders').countDocuments(currentMatch);
      const previousOrdersCount = await db.collection<MongoOrder>('orders').countDocuments(previousMatch);

      const customers = await db.collection<MongoOrder>('orders').distinct('user_id', currentMatch);
      const previousCustomers = await db.collection<MongoOrder>('orders').distinct('user_id', previousMatch);
      const customersCount = Array.isArray(customers) ? customers.length : 0;
      const previousCustomersCount = Array.isArray(previousCustomers) ? previousCustomers.length : 0;

      const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;

      type SeriesRow = { _id: string; revenue: number; orders: number };
      const seriesAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate<SeriesRow>([
          { $match: currentMatch },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
              revenue: { $sum: '$total_amount' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const series = seriesAgg.map((r) => ({
        date: String(r._id || ''),
        revenue: Number(r.revenue || 0),
        orders: Number(r.orders || 0),
      }));

      type StatusRow = { _id: string; count: number; revenue: number };
      const statusAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate<StatusRow>([
          { $match: currentMatch },
          { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total_amount' } } },
          { $sort: { revenue: -1 } },
        ])
        .toArray();

      const statusBreakdown = statusAgg.map((r) => ({
        status: String(r._id || ''),
        count: Number(r.count || 0),
        revenue: Number(r.revenue || 0),
      }));

      type TopAggRow = { _id: string; sales: number; revenue: number };
      const topAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate<TopAggRow>([
          { $match: currentMatch },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product_id',
              sales: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      const topProductIds = topAgg.map((t) => String(t._id)).filter((id) => ObjectId.isValid(id));
      const topProductsDocs = topProductIds.length
        ? await db
            .collection<MongoProduct>('products')
            .find({ _id: { $in: topProductIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : [];
      const topProductById = new Map(
        topProductsDocs.map((p) => {
          const normalized: Product = { ...p, _id: p._id.toString() };
          return [normalized._id, normalized] as const;
        })
      );

      const topProducts = topAgg.map((t) => {
        const productId = String(t._id);
        const product = topProductById.get(productId);
        return {
          _id: productId,
          name: product?.name || 'Unknown Product',
          category: String(product?.category || ''),
          sales: Number(t.sales || 0),
          revenue: Number(t.revenue || 0),
        };
      });

      type CategoryRow = { _id: string; revenue: number; sales: number };
      const categoryAgg = await db
        .collection<MongoOrder>('orders')
        .aggregate<CategoryRow>([
          { $match: currentMatch },
          { $unwind: '$items' },
          {
            $addFields: {
              productObjectId: {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: '$items.product_id' }, 'string'] },
                      {
                        $regexMatch: {
                          input: '$items.product_id',
                          regex: /^[0-9a-fA-F]{24}$/,
                        },
                      },
                    ],
                  },
                  { $toObjectId: '$items.product_id' },
                  null,
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: 'productObjectId',
              foreignField: '_id',
              as: 'product',
            },
          },
          { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$product.category',
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
              sales: { $sum: '$items.quantity' },
            },
          },
          { $match: { _id: { $type: 'string', $ne: '' } } },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      const revenueByCategory = categoryAgg.map((r) => ({
        category: String(r._id || ''),
        revenue: Number(r.revenue || 0),
        sales: Number(r.sales || 0),
      }));

      return NextResponse.json({
        success: true,
        data: {
          period: {
            days,
            start: currentStart.toISOString(),
            end: now.toISOString(),
          },
          summary: {
            revenue,
            orders: ordersCount,
            customers: customersCount,
            avgOrderValue,
            revenueGrowth: growthPercent(revenue, previousRevenue),
            orderGrowth: growthPercent(ordersCount, previousOrdersCount),
            customerGrowth: growthPercent(customersCount, previousCustomersCount),
          },
          series,
          statusBreakdown,
          topProducts,
          revenueByCategory,
        },
      });
    }

    if (adminCustomers) {
      const isAdmin = await isAdminEmail(authUser.email);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const q = (searchParams.get('q') || '').trim();
      const page = Math.max(1, Number(searchParams.get('page') || 1));
      const limitRaw = Number(searchParams.get('limit') || 20);
      const limit = Math.min(100, Math.max(1, limitRaw));
      const skip = (page - 1) * limit;

      const baseMatch: Record<string, unknown> = {
        status: { $ne: 'cancelled' },
        'shipping_address.email': { $exists: true, $ne: '' },
      };

      if (q) {
        baseMatch.$or = [
          { 'shipping_address.email': { $regex: q, $options: 'i' } },
          { 'shipping_address.firstName': { $regex: q, $options: 'i' } },
          { 'shipping_address.lastName': { $regex: q, $options: 'i' } },
          { 'shipping_address.phone': { $regex: q, $options: 'i' } },
        ];
      }

      const agg = await db
        .collection<MongoOrder>('orders')
        .aggregate([
          { $match: baseMatch },
          { $sort: { created_at: -1 } },
          { $addFields: { emailLower: { $toLower: '$shipping_address.email' } } },
          {
            $group: {
              _id: '$emailLower',
              email: { $first: '$shipping_address.email' },
              firstName: { $first: '$shipping_address.firstName' },
              lastName: { $first: '$shipping_address.lastName' },
              phone: { $first: '$shipping_address.phone' },
              address: { $first: '$shipping_address.address' },
              city: { $first: '$shipping_address.city' },
              state: { $first: '$shipping_address.state' },
              zipCode: { $first: '$shipping_address.zipCode' },
              country: { $first: '$shipping_address.country' },
              firstOrderAt: { $last: '$created_at' },
              lastOrderAt: { $first: '$created_at' },
              ordersCount: { $sum: 1 },
              totalSpent: { $sum: '$total_amount' },
            },
          },
          { $sort: { lastOrderAt: -1 } },
          {
            $facet: {
              customers: [{ $skip: skip }, { $limit: limit }],
              total: [{ $count: 'total' }],
            },
          },
        ])
        .toArray();

      type CustomerAggRow = {
        _id?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        firstOrderAt?: Date | string;
        lastOrderAt?: Date | string;
        ordersCount?: number;
        totalSpent?: number;
      };

      const customers = (Array.isArray(agg?.[0]?.customers) ? agg[0].customers : []) as CustomerAggRow[];
      const total = Number(agg?.[0]?.total?.[0]?.total || 0);

      const normalized = customers.map((c) => ({
        id: String(c._id || ''),
        email: String(c.email || ''),
        name: `${String(c.firstName || '')} ${String(c.lastName || '')}`.trim(),
        phone: String(c.phone || ''),
        address: String(c.address || ''),
        city: String(c.city || ''),
        state: String(c.state || ''),
        zipCode: String(c.zipCode || ''),
        country: String(c.country || ''),
        firstOrderAt: c.firstOrderAt instanceof Date ? c.firstOrderAt.toISOString() : String(c.firstOrderAt || ''),
        lastOrderAt: c.lastOrderAt instanceof Date ? c.lastOrderAt.toISOString() : String(c.lastOrderAt || ''),
        ordersCount: Number(c.ordersCount || 0),
        totalSpent: Number(c.totalSpent || 0),
      }));

      return NextResponse.json({
        success: true,
        data: {
          customers: normalized,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    }

    if (adminOrders) {
      const isAdmin = await isAdminEmail(authUser.email);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const statusParam = searchParams.get('status') || '';
      const q = (searchParams.get('q') || '').trim();
      const page = Math.max(1, Number(searchParams.get('page') || 1));
      const limitRaw = Number(searchParams.get('limit') || 20);
      const limit = Math.min(100, Math.max(1, limitRaw));
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = {};
      if (isOrderStatus(statusParam)) {
        query.status = statusParam;
      }

      if (q) {
        const searchOr: Record<string, unknown>[] = [
          { 'shipping_address.email': { $regex: q, $options: 'i' } },
          { 'shipping_address.firstName': { $regex: q, $options: 'i' } },
          { 'shipping_address.lastName': { $regex: q, $options: 'i' } },
          { 'shipping_address.phone': { $regex: q, $options: 'i' } },
        ];
        if (ObjectId.isValid(q)) {
          searchOr.push({ _id: new ObjectId(q) });
        }
        query.$or = searchOr;
      }

      const orders = await db
        .collection<MongoOrder>('orders')
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await db.collection<MongoOrder>('orders').countDocuments(query);

      const productIdSet = new Set<string>();
      for (const order of orders) {
        for (const item of order.items || []) {
          if (item?.product_id) productIdSet.add(String(item.product_id));
        }
      }

      const productIds = [...productIdSet]
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      const products = productIds.length
        ? await db.collection<MongoProduct>('products').find({ _id: { $in: productIds } }).toArray()
        : [];
      const productById = new Map(
        products.map((p) => {
          const normalized: Product = { ...p, _id: p._id.toString() };
          return [normalized._id, normalized] as const;
        })
      );

      const normalizedOrders = orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        items: (order.items || []).map((item) => ({
          ...item,
          product: item?.product_id ? productById.get(String(item.product_id)) : undefined,
        })),
      }));

      return NextResponse.json({
        success: true,
        data: {
          orders: normalizedOrders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    }

    const userId = authUser.id;
    const orders = await db
      .collection<MongoOrder>('orders')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    const productIdSet = new Set<string>();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item?.product_id) productIdSet.add(String(item.product_id));
      }
    }
    const productIds = [...productIdSet].filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    const products = productIds.length
      ? await db.collection<MongoProduct>('products').find({ _id: { $in: productIds } }).toArray()
      : [];
    const productById = new Map(
      products.map((p) => {
        const normalized: Product = { ...p, _id: p._id.toString() };
        return [normalized._id, normalized] as const;
      })
    );

    const enrichedOrders = orders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      items: (order.items || []).map((item) => ({
        ...item,
        product: item?.product_id ? productById.get(String(item.product_id)) : undefined,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: enrichedOrders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
