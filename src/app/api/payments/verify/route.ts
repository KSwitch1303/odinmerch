import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import { verifyTransaction } from '@/lib/paystack';
import { applyVerifiedTransaction } from '@/lib/orders';

async function getUserIdFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

// Called by the order-success page after Paystack redirects back with ?reference=.
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const reference = (request.nextUrl.searchParams.get('reference') || '').trim();
    if (!reference || reference.length > 100) {
      return NextResponse.json({ success: false, error: 'Missing reference' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const order = await db
      .collection('orders')
      .findOne({ payment_reference: reference, user_id: userId });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        data: { orderId: order._id.toString(), paymentStatus: 'paid' },
      });
    }

    const tx = await verifyTransaction(reference);
    const result = await applyVerifiedTransaction(db, tx);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ success: false, error: 'Could not verify payment' }, { status: 500 });
  }
}
