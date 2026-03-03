import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Shipping Info — LUXE',
  description: 'Shipping timelines, delivery options, and tracking details.',
};

const SECTIONS = [
  {
    id: 'processing',
    title: 'Processing time',
    items: [
      'Orders are typically processed within 1–2 business days.',
      'During drops, holidays, or high-volume periods, processing may take longer.',
      'If we need to confirm details (address, payment), processing may be delayed.',
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery timelines',
    items: [
      'Standard delivery: 2–5 business days after dispatch (location dependent).',
      'Express delivery: 1–3 business days after dispatch (where available).',
      'Delivery timelines are estimates and may vary due to carrier delays or weather.',
    ],
  },
  {
    id: 'rates',
    title: 'Shipping rates',
    items: [
      'Shipping costs are calculated at checkout based on destination and order size.',
      'Any free-shipping promos will be displayed automatically at checkout when eligible.',
    ],
  },
  {
    id: 'tracking',
    title: 'Tracking',
    items: [
      'Once your order ships, you’ll receive a tracking link via email.',
      'Tracking updates may take 12–24 hours to appear after dispatch.',
    ],
  },
  {
    id: 'address',
    title: 'Address & delivery notes',
    items: [
      'Please double-check your delivery address before placing your order.',
      'Include helpful delivery notes (gate codes, landmarks) to avoid failed delivery attempts.',
      'If an address update is needed, contact us as soon as possible after placing your order.',
    ],
  },
  {
    id: 'international',
    title: 'International shipping',
    items: [
      'International options may be available depending on your country.',
      'Customs duties and taxes (if applicable) are the responsibility of the customer unless stated otherwise at checkout.',
    ],
  },
];

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="luxury-heading text-xl md:text-2xl scroll-mt-24">
      {children}
    </h2>
  );
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="luxury-heading text-3xl md:text-4xl">Shipping Info</h1>
            <p className="mt-3 text-neutral-700 max-w-2xl">
              Everything you need to know about dispatch, delivery, and tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.id} className="border border-neutral-200 p-6 md:p-8">
                <SectionTitle id={section.id}>{section.title}</SectionTitle>
                <ul className="mt-4 list-disc pl-5 space-y-2 text-neutral-700">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="border border-neutral-200 bg-neutral-50 p-6 md:p-8">
              <h2 className="luxury-heading text-xl md:text-2xl">Dispatch confirmation</h2>
              <p className="mt-3 text-neutral-700">
                Your order is considered dispatched once it’s handed to the carrier. You’ll receive an email with a
                tracking link when that happens.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Need help?</h3>
              <p className="mt-3 text-sm text-neutral-700">
                If you have a delivery issue, include your order number and the email used at checkout.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                Contact support
              </Link>
            </div>

            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Returns</h3>
              <p className="mt-3 text-sm text-neutral-700">
                If something isn’t quite right, review the returns policy for eligibility and instructions.
              </p>
              <Link
                href="/returns"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View returns policy
              </Link>
            </div>

            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Care</h3>
              <p className="mt-3 text-sm text-neutral-700">
                Proper care keeps your pieces looking sharp after every wear.
              </p>
              <Link
                href="/care"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View care instructions
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
