import Navigation from '@/components/Navigation';
import HeroBanner from '@/components/HeroBanner';
import FeaturedCollections from '@/components/FeaturedCollections';
import DiscountedDeals from '@/components/DiscountedDeals';
import BrandStory from '@/components/BrandStory';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation hideBrandOnHome overlay />
      <HeroBanner />
      <div className="relative z-10 -mt-24 pt-24">
        <div className="bg-white shadow-[0_-18px_40px_rgba(0,0,0,0.12)]">
          <div className="pt-16">
            <div className="relative">
              <div className="sticky bottom-0 z-10">
                <FeaturedCollections />
              </div>
              <div className="relative z-20 -mt-14 sm:-mt-20 lg:-mt-24">
                <DiscountedDeals />
              </div>
            </div>
            {/* <BrandStory />
            <Newsletter /> */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
