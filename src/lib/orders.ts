import { ObjectId, type Db } from 'mongodb';
import { toKobo, type PaystackTransaction } from '@/lib/paystack';

type StoredOrder = {
  _id: ObjectId;
  user_id: string;
  items: { product_id: string; quantity: number; size: string }[];
  total_amount: number;
  payment_status?: 'unpaid' | 'paid' | 'failed';
  payment_reference?: string;
};

export type PaymentResult = {
  orderId: string;
  paymentStatus: 'unpaid' | 'paid' | 'failed';
};

// Marks the order for a verified Paystack transaction as paid, then decrements
// inventory and clears the buyer's cart. Safe to call more than once per
// reference (callback page and webhook can race): only the first call applies.
export async function applyVerifiedTransaction(db: Db, tx: PaystackTransaction): Promise<PaymentResult | null> {
  const orders = db.collection<StoredOrder>('orders');
  const order = await orders.findOne({ payment_reference: tx.reference });
  if (!order) return null;

  const orderId = order._id.toString();
  if (order.payment_status === 'paid') {
    return { orderId, paymentStatus: 'paid' };
  }

  if (tx.status !== 'success') {
    if (tx.status === 'failed' || tx.status === 'reversed') {
      await orders.updateOne(
        { _id: order._id, payment_status: { $ne: 'paid' } },
        { $set: { payment_status: 'failed', updated_at: new Date() } }
      );
      return { orderId, paymentStatus: 'failed' };
    }
    return { orderId, paymentStatus: 'unpaid' };
  }

  if (tx.currency !== 'NGN' || tx.amount !== toKobo(order.total_amount)) {
    console.error('Paystack amount mismatch', { orderId, reference: tx.reference, amount: tx.amount, currency: tx.currency });
    await orders.updateOne(
      { _id: order._id, payment_status: { $ne: 'paid' } },
      { $set: { payment_status: 'failed', payment_error: 'amount_mismatch', updated_at: new Date() } }
    );
    return { orderId, paymentStatus: 'failed' };
  }

  const now = new Date();
  const claimed = await orders.updateOne(
    { _id: order._id, payment_status: { $ne: 'paid' } },
    {
      $set: {
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: tx.paid_at ? new Date(tx.paid_at) : now,
        updated_at: now,
      },
    }
  );
  if (claimed.modifiedCount === 0) {
    return { orderId, paymentStatus: 'paid' };
  }

  const shortfall: string[] = [];
  for (const item of order.items || []) {
    if (!ObjectId.isValid(item.product_id)) continue;
    const res = await db.collection('products').updateOne(
      { _id: new ObjectId(item.product_id), inventory: { $gte: item.quantity } },
      { $inc: { inventory: -item.quantity } }
    );
    if (res.modifiedCount === 0) shortfall.push(item.product_id);
  }
  if (shortfall.length) {
    await orders.updateOne({ _id: order._id }, { $set: { stock_shortfall: shortfall } });
  }

  const cart = await db.collection('carts').findOne({ user_id: order.user_id });
  if (cart?._id) {
    await db.collection('cart_items').deleteMany({ cart_id: cart._id });
    await db.collection('carts').deleteOne({ _id: cart._id });
  }

  return { orderId, paymentStatus: 'paid' };
}
