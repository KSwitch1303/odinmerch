import type { Metadata } from "next";
import { Playfair_Display, Inter } from 'next/font/google';
import "./globals.css";
import BrandHead from '@/components/BrandHead';
import { AuthProvider } from '@/context/AuthProvider';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "LUXE - Luxury Fashion House",
  description: "Discover exclusive luxury fashion with timeless elegance and premium craftsmanship.",
  keywords: "luxury fashion, designer clothing, premium fashion, exclusive fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${playfair.variable} ${inter.variable}`}>
        <AuthProvider>
          <BrandHead />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
