import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { isValidWebhookSignature, verifyTransaction } from '@/lib/paystack';
import { applyVerifiedTransaction } from '@/lib/orders';

// Paystack webhook: register <APP_URL>/api/payments/webhook in the Paystack
// dashboard. Confirms orders even if the buyer never returns to the site.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    const reference = String(event?.data?.reference || '');
    if (event?.event === 'charge.success' && reference) {
      // Re-verify with the API rather than trusting the payload's amount.
      const tx = await verifyTransaction(reference);
      const client = await clientPromise;
      await applyVerifiedTransaction(client.db('luxury-ecommerce'), tx);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    // Non-2xx makes Paystack retry later.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
