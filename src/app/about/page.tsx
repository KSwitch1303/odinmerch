import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About — ODIN',
  description: 'Learn about ODIN: our story, values, and approach to modern essentials.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <header className="border border-neutral-200 bg-white p-6 sm:p-8">
          <h1 className="luxury-heading text-3xl md:text-4xl font-semibold tracking-wide">About Us</h1>
          <p className="mt-4 text-neutral-700 leading-relaxed max-w-3xl">
            ODIN was founded in 2021 with a simple focus: create pieces that feel premium, wear effortlessly, and stay in
            rotation season after season. We build around clean silhouettes, thoughtful details, and dependable quality—
            so getting dressed always feels easy.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="border border-neutral-200 p-6">
            <h2 className="luxury-heading text-xl">Our Approach</h2>
            <p className="mt-3 text-neutral-700 leading-relaxed">
              We keep the design language minimal and intentional. Every seam, fit decision, and finish is chosen to
              elevate the garment without shouting for attention.
            </p>
          </div>
          <div className="border border-neutral-200 p-6">
            <h2 className="luxury-heading text-xl">Quality First</h2>
            <p className="mt-3 text-neutral-700 leading-relaxed">
              We prioritize comfort, durability, and drape. From stitching to construction, our goal is consistent
              quality you can rely on—wear after wear.
            </p>
          </div>
          <div className="border border-neutral-200 p-6">
            <h2 className="luxury-heading text-xl">Made to Last</h2>
            <p className="mt-3 text-neutral-700 leading-relaxed">
              Trends move fast. We don’t. ODIN is built around timeless essentials designed to outlive the moment and
              fit naturally into your everyday wardrobe.
            </p>
          </div>
        </section>

        <section className="border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
          <h2 className="luxury-heading text-2xl">What we value</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-700">
            <div className="border border-neutral-200 bg-white p-5">
              <p className="font-medium text-black">Simplicity</p>
              <p className="mt-2 leading-relaxed">
                Clean design, refined fit, and subtle details that make a difference.
              </p>
            </div>
            <div className="border border-neutral-200 bg-white p-5">
              <p className="font-medium text-black">Consistency</p>
              <p className="mt-2 leading-relaxed">
                Reliable sizing and quality so you know what to expect every time.
              </p>
            </div>
            <div className="border border-neutral-200 bg-white p-5">
              <p className="font-medium text-black">Care</p>
              <p className="mt-2 leading-relaxed">
                Materials and construction chosen to wear well and maintain shape.
              </p>
            </div>
            <div className="border border-neutral-200 bg-white p-5">
              <p className="font-medium text-black">Respect</p>
              <p className="mt-2 leading-relaxed">
                A customer-first experience—clear information, quick support, and honest guidance.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

