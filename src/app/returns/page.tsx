import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Returns — LUXE',
  description: 'Returns policy, eligibility, and how to start a return.',
};

const SECTIONS = [
  {
    id: 'eligibility',
    title: 'Eligibility',
    items: [
      'Returns are accepted within 7 days of delivery (unless stated otherwise).',
      'Items must be unworn, unwashed, and in original condition with tags attached.',
      'Items marked final sale are not eligible for return.',
    ],
  },
  {
    id: 'how-to',
    title: 'How to start a return',
    items: [
      'Contact support with your order number and the email used at checkout.',
      'Share the reason for return and any photos if the item arrived damaged.',
      'Once approved, you’ll receive return instructions and the return address.',
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds',
    items: [
      'Refunds are processed after inspection once the return is received.',
      'Refunds are issued to the original payment method where possible.',
      'Original shipping fees are not refundable unless the return is due to our error.',
    ],
  },
  {
    id: 'exchanges',
    title: 'Exchanges',
    items: [
      'If you need a different size, we recommend placing a new order to reserve stock.',
      'Contact support and we’ll guide you through the smoothest option for your case.',
    ],
  },
  {
    id: 'damaged',
    title: 'Damaged or incorrect items',
    items: [
      'If your order arrives damaged or incorrect, contact us within 48 hours of delivery.',
      'Include your order number and clear photos so we can resolve it quickly.',
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

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="luxury-heading text-3xl md:text-4xl">Returns</h1>
            <p className="mt-3 text-neutral-700 max-w-2xl">
              We want you to love your purchase. Here’s how returns work and how to get help.
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
              <h2 className="luxury-heading text-xl md:text-2xl">Packaging tips</h2>
              <p className="mt-3 text-neutral-700">
                Use the original packaging when possible. Ensure items are protected and include all accessories that
                came with your order.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Start a return</h3>
              <p className="mt-3 text-sm text-neutral-700">
                Message us with your order number and we’ll guide you through the next steps.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                Contact support
              </Link>
            </div>

            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Sizing</h3>
              <p className="mt-3 text-sm text-neutral-700">
                Check measurements before ordering to reduce sizing issues.
              </p>
              <Link
                href="/size-guide"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View size guide
              </Link>
            </div>

            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Shipping</h3>
              <p className="mt-3 text-sm text-neutral-700">
                Review dispatch and delivery timelines, plus tracking details.
              </p>
              <Link
                href="/shipping"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View shipping info
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
