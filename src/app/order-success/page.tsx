'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckCircle, Package, Clock } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">
            Order Confirmed
          </h1>
          <p className="text-gray-600 text-lg">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
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
              <h3 className="font-semibold text-black mb-2">Confirmation</h3>
              <p className="text-sm text-gray-600">
                Order confirmation sent to your email
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
              <a href="mailto:support@luxuryboutique.com" className="text-black hover:text-gray-700">
                support@luxuryboutique.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}