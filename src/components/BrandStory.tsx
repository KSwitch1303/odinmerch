import Image from 'next/image';

export default function BrandStory() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold luxury-heading text-black mb-6">
              Crafting Luxury Since 1985
            </h2>
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                Founded on the principles of exceptional craftsmanship and timeless design, 
                LUXE has been synonymous with luxury fashion for over three decades. 
                Our commitment to quality and innovation has established us as a leading 
                name in high-end fashion.
              </p>
              <p>
                Each piece in our collection is carefully crafted by skilled artisans 
                using the finest materials sourced from around the world. We believe 
                that true luxury lies not just in the appearance, but in the feeling 
                of wearing something extraordinary.
              </p>
              <p>
                Our design philosophy combines classic elegance with contemporary 
                sophistication, creating pieces that transcend trends and become 
                cherished wardrobe staples for the discerning fashion enthusiast.
              </p>
            </div>
            <div className="mt-8">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-black mb-2">35+</div>
                  <div className="text-sm text-gray-600">Years of Excellence</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-black mb-2">50+</div>
                  <div className="text-sm text-gray-600">Master Craftsmen</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-black mb-2">100%</div>
                  <div className="text-sm text-gray-600">Premium Materials</div>
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] relative rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20fashion%20atelier%2C%20artisan%20crafting%20premium%20clothing%2C%20elegant%20workshop%20setting%2C%20high-end%20fashion%20production%2C%20sophisticated%20craftsmanship%2C%20premium%20materials&image_size=portrait_4_3"
                alt="LUXE Atelier - Crafting Excellence"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-black text-white p-6 rounded-lg shadow-xl">
              <div className="text-sm font-medium tracking-wider uppercase mb-1">Established</div>
              <div className="text-2xl font-bold luxury-heading">1985</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}