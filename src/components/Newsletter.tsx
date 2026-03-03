'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with your email service
    console.log('Newsletter signup:', email);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setEmail('');
  };

  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold luxury-heading mb-4">
          Join Our Exclusive Community
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Be the first to discover new collections, exclusive offers, and behind-the-scenes content from the world of luxury fashion.
        </p>
        
        {isSubmitted ? (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-gray-300">
              Welcome to our exclusive community. You&apos;ll receive our latest updates soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-white text-black border border-gray-300 focus:border-white focus:outline-none transition-colors"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-white text-black font-medium tracking-wide hover:bg-gray-100 transition-colors duration-300"
              >
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              By subscribing, you agree to our privacy policy and terms of service.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}