import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact — LUXE',
  description: 'Contact LUXE for inquiries, customer service, and press.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="luxury-heading text-3xl md:text-4xl">Contact Us</h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 max-w-2xl">
          For product inquiries, bespoke services, and press, please reach out using the form below.
        </p>

        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}

