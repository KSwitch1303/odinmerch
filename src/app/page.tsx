import Navigation from '@/components/Navigation';
import HeroBanner from '@/components/HeroBanner';
import FeaturedCollections from '@/components/FeaturedCollections';
import BrandStory from '@/components/BrandStory';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation hideBrandOnHome overlay />
      <HeroBanner />
      <div className="-mt-16 pt-16">
        <FeaturedCollections />
        {/* <BrandStory />
        <Newsletter /> */}
        <Footer />
      </div>
    </div>
  );
}
