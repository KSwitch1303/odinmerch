import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Care Instructions — LUXE',
  description: 'How to care for your pieces to preserve fit, color, and drape.',
};

const CARE_SECTIONS = [
  {
    id: 'general',
    title: 'General care',
    items: [
      'Follow the care label inside the garment—label instructions take priority.',
      'Wash less when possible. Spot-clean minor marks to preserve fabric and color.',
      'Turn garments inside out before washing to reduce abrasion and fading.',
      'Separate lights and darks. Avoid overloading the machine.',
    ],
  },
  {
    id: 'washing',
    title: 'Washing',
    items: [
      'Use cold or lukewarm water for most items unless the label says otherwise.',
      'Choose a gentle cycle for delicates and structured pieces.',
      'Use mild detergent. Avoid bleach unless explicitly stated on the label.',
      'For delicate fabrics, use a mesh laundry bag.',
    ],
  },
  {
    id: 'drying',
    title: 'Drying',
    items: [
      'Air-dry whenever possible to reduce shrinkage and maintain shape.',
      'Lay knitwear flat to dry to prevent stretching.',
      'Avoid direct sun for dark colors to minimize fading.',
      'If using a dryer, use low heat and remove promptly.',
    ],
  },
  {
    id: 'ironing-steaming',
    title: 'Ironing & steaming',
    items: [
      'Steam is ideal for most fabrics and helps refresh between wears.',
      'If ironing, use the recommended temperature and iron inside out when possible.',
      'Use a pressing cloth for delicate fabrics to avoid shine marks.',
    ],
  },
  {
    id: 'storage',
    title: 'Storage',
    items: [
      'Hang jackets, coats, and tailored pieces on structured hangers.',
      'Fold knitwear to prevent shoulder stretch.',
      'Store in a cool, dry place. Use breathable garment bags for special pieces.',
      'Keep away from perfumes and oils that can stain or discolor fabric.',
    ],
  },
  {
    id: 'special',
    title: 'Special fabrics',
    items: [
      'Leather & suede: avoid water, blot immediately, and use a specialist cleaner.',
      'Silk: avoid harsh agitation; consider professional dry cleaning for best results.',
      'Denim: wash inside out, cold, and less frequently to preserve color.',
      'Wool: air out between wears; dry clean only if needed per label.',
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

export default function CarePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="luxury-heading text-3xl md:text-4xl">Care Instructions</h1>
            <p className="mt-3 text-neutral-700 max-w-2xl">
              Simple care habits keep your pieces looking sharp for longer—preserving fit, drape, and finish.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {CARE_SECTIONS.map((s) => (
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
            {CARE_SECTIONS.map((section) => (
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
              <h2 className="luxury-heading text-xl md:text-2xl">Quick reminders</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-700">
                <div className="border border-neutral-200 bg-white p-4">
                  Cold wash, gentle cycle
                </div>
                <div className="border border-neutral-200 bg-white p-4">
                  Air-dry for best shape
                </div>
                <div className="border border-neutral-200 bg-white p-4">
                  Steam to refresh
                </div>
                <div className="border border-neutral-200 bg-white p-4">
                  Fold knits, hang tailoring
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Need help?</h3>
              <p className="mt-3 text-sm text-neutral-700">
                If you’re unsure how to care for a specific piece, share a photo of the care label and the product name.
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
                For a better fit (and fewer returns), use our sizing guide before ordering.
              </p>
              <Link
                href="/size-guide"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View size guide
              </Link>
            </div>

            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Returns</h3>
              <p className="mt-3 text-sm text-neutral-700">
                Keep tags attached and store items in original packaging for easy returns when applicable.
              </p>
              <Link
                href="/returns"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View returns policy
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
