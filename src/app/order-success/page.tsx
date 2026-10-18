'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckCircle, Package, Clock, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PaymentState = 'verifying' | 'paid' | 'unpaid' | 'failed' | 'error';

const SUPPORT_EMAIL = 'Odinmerch990@gmail.com';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const [state, setState] = useState<PaymentState>(reference ? 'verifying' : 'error');

  useEffect(() => {
    if (!reference) return;
    const verify = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setState('error');
          return;
        }
        const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        const status = json?.data?.paymentStatus;
        if (status === 'paid') {
          setState('paid');
          window.dispatchEvent(new Event('cart:changed'));
        } else if (status === 'failed') {
          setState('failed');
        } else if (status === 'unpaid') {
          setState('unpaid');
        } else {
          setState('error');
        }
      } catch {
        setState('error');
      }
    };
    verify();
  }, [reference]);

  if (state === 'verifying') {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-12 w-12 text-gold mx-auto mb-6 animate-spin" />
        <h1 className="text-2xl font-bold text-black">Confirming your payment…</h1>
      </div>
    );
  }

  if (state !== 'paid') {
    const message =
      state === 'failed'
        ? 'Your payment was not successful and you have not been charged for this order.'
        : state === 'unpaid'
          ? 'We have not received your payment yet. If you completed it, it may take a moment to confirm.'
          : 'We could not confirm this payment.';
    return (
      <div className="text-center py-16">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-black mb-4">Payment not confirmed</h1>
        <p className="text-gray-600 text-lg mb-8">{message}</p>
        <div className="space-y-4">
          <Link href="/cart" className="luxury-button inline-block">
            Back to Cart
          </Link>
          <p className="text-sm text-gray-600">
            Need help? Email{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-black hover:text-gray-700">
              {SUPPORT_EMAIL}
            </a>
            {reference ? <> with reference {reference}</> : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-black mb-4">
          Order Confirmed
        </h1>
        <p className="text-gray-600 text-lg">
          Thank you for your purchase. Your payment was received and your order is being processed.
        </p>
        <p className="text-sm text-gray-500 mt-2">Payment reference: {reference}</p>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <Package className="h-8 w-8 text-gold mx-auto mb-3" />
            <h3 className="font-semibold text-black mb-2">Order Processing</h3>
            <p className="text-sm text-gray-600">
              Your order is being prepared for shipment
            </p>
          </div>
          <div>
            <Clock className="h-8 w-8 text-gold mx-auto mb-3" />
            <h3 className="font-semibold text-black mb-2">Estimated Delivery</h3>
            <p className="text-sm text-gray-600">
              3-5 business days for standard shipping
            </p>
          </div>
          <div>
            <CheckCircle className="h-8 w-8 text-gold mx-auto mb-3" />
            <h3 className="font-semibold text-black mb-2">Track Your Order</h3>
            <p className="text-sm text-gray-600">
              See its status any time in your account
            </p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <Link href="/products" className="luxury-button inline-block">
          Continue Shopping
        </Link>
        <div className="text-sm text-gray-600">
          <p>Need help? Contact our customer service team</p>
          <p className="mt-2">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-black hover:text-gray-700">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Suspense fallback={null}>
          <OrderSuccessContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
