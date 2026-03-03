import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Size Guide — LUXE',
  description: 'Find your perfect fit with our size guide and measuring tips.',
};

const TOPS = [
  { size: 'XS', chestCm: '80–84', waistCm: '62–66', hipsCm: '86–90' },
  { size: 'S', chestCm: '85–90', waistCm: '67–72', hipsCm: '91–96' },
  { size: 'M', chestCm: '91–98', waistCm: '73–80', hipsCm: '97–104' },
  { size: 'L', chestCm: '99–106', waistCm: '81–88', hipsCm: '105–112' },
  { size: 'XL', chestCm: '107–114', waistCm: '89–96', hipsCm: '113–120' },
];

const BOTTOMS = [
  { size: 'XS', waistCm: '62–66', hipsCm: '86–90', inseamCm: '76–79' },
  { size: 'S', waistCm: '67–72', hipsCm: '91–96', inseamCm: '79–81' },
  { size: 'M', waistCm: '73–80', hipsCm: '97–104', inseamCm: '81–83' },
  { size: 'L', waistCm: '81–88', hipsCm: '105–112', inseamCm: '83–85' },
  { size: 'XL', waistCm: '89–96', hipsCm: '113–120', inseamCm: '85–87' },
];

const SHOES = [
  { eu: '36', uk: '3', us: '5', footCm: '22.5' },
  { eu: '37', uk: '4', us: '6', footCm: '23.5' },
  { eu: '38', uk: '5', us: '7', footCm: '24.5' },
  { eu: '39', uk: '6', us: '8', footCm: '25.0' },
  { eu: '40', uk: '7', us: '9', footCm: '26.0' },
  { eu: '41', uk: '8', us: '10', footCm: '26.5' },
  { eu: '42', uk: '9', us: '11', footCm: '27.5' },
  { eu: '43', uk: '10', us: '12', footCm: '28.0' },
];

function SectionTitle({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="luxury-heading text-xl md:text-2xl scroll-mt-24">
      {children}
    </h2>
  );
}

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="luxury-heading text-3xl md:text-4xl">Size Guide</h1>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300 max-w-2xl">
              Use this guide to find your best fit. If you’re between sizes, we recommend choosing the larger size for a
              more relaxed fit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="#how-to-measure"
              className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm"
            >
              How to measure
            </a>
            <a
              href="#tops"
              className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm"
            >
              Tops
            </a>
            <a
              href="#bottoms"
              className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm"
            >
              Bottoms
            </a>
            <a
              href="#shoes"
              className="px-3 py-2 border border-neutral-200 hover:border-black transition-colors text-sm"
            >
              Shoes
            </a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <section className="border border-neutral-200 p-6 md:p-8">
              <SectionTitle id="how-to-measure">How to measure</SectionTitle>
              <div className="mt-4 space-y-3 text-neutral-700">
                <p>Measure over light clothing. Keep the tape comfortably snug and parallel to the floor.</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-medium text-black">Chest:</span> Around the fullest part of your chest.
                  </li>
                  <li>
                    <span className="font-medium text-black">Waist:</span> Around the narrowest part of your waist.
                  </li>
                  <li>
                    <span className="font-medium text-black">Hips:</span> Around the fullest part of your hips.
                  </li>
                  <li>
                    <span className="font-medium text-black">Inseam:</span> From crotch seam to the bottom of the
                    ankle.
                  </li>
                  <li>
                    <span className="font-medium text-black">Foot length:</span> Heel to longest toe.
                  </li>
                </ul>
              </div>
            </section>

            <section className="border border-neutral-200 p-6 md:p-8">
              <SectionTitle id="tops">Tops (cm)</SectionTitle>
              <p className="mt-3 text-neutral-700">
                Shirts, tees, knitwear, and outer layers. Measurements are body measurements, not garment measurements.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-600 border-b border-neutral-200">
                      <th className="py-3 pr-6 font-medium">Size</th>
                      <th className="py-3 pr-6 font-medium">Chest (cm)</th>
                      <th className="py-3 pr-6 font-medium">Waist (cm)</th>
                      <th className="py-3 font-medium">Hips (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOPS.map((row) => (
                      <tr key={row.size} className="border-b border-neutral-100">
                        <td className="py-3 pr-6 font-medium text-black">{row.size}</td>
                        <td className="py-3 pr-6 text-neutral-700">{row.chestCm}</td>
                        <td className="py-3 pr-6 text-neutral-700">{row.waistCm}</td>
                        <td className="py-3 text-neutral-700">{row.hipsCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-neutral-200 p-6 md:p-8">
              <SectionTitle id="bottoms">Bottoms (cm)</SectionTitle>
              <p className="mt-3 text-neutral-700">
                Trousers, denim, and tailored bottoms. If you prefer a higher rise fit, size up.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-600 border-b border-neutral-200">
                      <th className="py-3 pr-6 font-medium">Size</th>
                      <th className="py-3 pr-6 font-medium">Waist (cm)</th>
                      <th className="py-3 pr-6 font-medium">Hips (cm)</th>
                      <th className="py-3 font-medium">Inseam (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BOTTOMS.map((row) => (
                      <tr key={row.size} className="border-b border-neutral-100">
                        <td className="py-3 pr-6 font-medium text-black">{row.size}</td>
                        <td className="py-3 pr-6 text-neutral-700">{row.waistCm}</td>
                        <td className="py-3 pr-6 text-neutral-700">{row.hipsCm}</td>
                        <td className="py-3 text-neutral-700">{row.inseamCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-neutral-200 p-6 md:p-8">
              <SectionTitle id="shoes">Shoes</SectionTitle>
              <p className="mt-3 text-neutral-700">
                If you’re between sizes, choose the larger size. For wider feet, consider sizing up.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-600 border-b border-neutral-200">
                      <th className="py-3 pr-6 font-medium">EU</th>
                      <th className="py-3 pr-6 font-medium">UK</th>
                      <th className="py-3 pr-6 font-medium">US</th>
                      <th className="py-3 font-medium">Foot length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHOES.map((row) => (
                      <tr key={row.eu} className="border-b border-neutral-100">
                        <td className="py-3 pr-6 font-medium text-black">{row.eu}</td>
                        <td className="py-3 pr-6 text-neutral-700">{row.uk}</td>
                        <td className="py-3 pr-6 text-neutral-700">{row.us}</td>
                        <td className="py-3 text-neutral-700">{row.footCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Fit notes</h3>
              <div className="mt-3 text-sm text-neutral-700 space-y-3">
                <p>Each collection may vary slightly by fabric, cut, and finishing.</p>
                <p>
                  If you need help choosing a size, contact us with your measurements and the product name for
                  personalized guidance.
                </p>
              </div>
            </div>
            <div className="border border-neutral-200 p-6">
              <h3 className="luxury-heading text-lg">Care</h3>
              <p className="mt-3 text-sm text-neutral-700">
                Proper care helps preserve fit and drape. Refer to the care label and our care instructions page for
                details.
              </p>
              <a
                href="/care"
                className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
              >
                View care instructions
              </a>
            </div>
          </aside>
        </div>

        <div className="mt-10 border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700">
          Sizing is provided as a guide. Actual fit may vary by style and personal preference.
        </div>
      </main>
      <Footer />
    </div>
  );
}
