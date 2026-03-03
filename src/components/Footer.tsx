'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Linkedin, Youtube, Music2 } from 'lucide-react';

export default function Footer() {
  const [businessName, setBusinessName] = useState('ODIN');
  const [slogan, setSlogan] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [copyrightText, setCopyrightText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json) return;
        setBusinessName(String(json.businessName || 'ODIN'));
        setSlogan(String(json.slogan || ''));
        setFacebookUrl(String(json.facebookUrl || ''));
        setInstagramUrl(String(json.instagramUrl || ''));
        setTwitterUrl(String(json.twitterUrl || ''));
        setTiktokUrl(String(json.tiktokUrl || ''));
        setYoutubeUrl(String(json.youtubeUrl || ''));
        setLinkedinUrl(String(json.linkedinUrl || ''));
        setContactEmail(String(json.contactEmail || ''));
        setPhoneNumber(String(json.phoneNumber || ''));
        setAddress(String(json.address || ''));
        setCopyrightText(String(json.copyrightText || ''));
      } catch {}
    };
    load();
  }, []);

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const socialLinks = useMemo(() => {
    const links = [
      { name: 'Facebook', href: normalizeUrl(facebookUrl), Icon: Facebook },
      { name: 'Instagram', href: normalizeUrl(instagramUrl), Icon: Instagram },
      { name: 'X', href: normalizeUrl(twitterUrl), Icon: Twitter },
      { name: 'TikTok', href: normalizeUrl(tiktokUrl), Icon: Music2 },
      { name: 'YouTube', href: normalizeUrl(youtubeUrl), Icon: Youtube },
      { name: 'LinkedIn', href: normalizeUrl(linkedinUrl), Icon: Linkedin },
    ].filter((l) => l.href);
    return links;
  }, [facebookUrl, instagramUrl, twitterUrl, tiktokUrl, youtubeUrl, linkedinUrl]);

  const year = new Date().getFullYear();
  const resolvedCopyright =
    copyrightText.trim() || `© ${year} ${businessName}. All rights reserved.`;

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold luxury-heading mb-4">{businessName}</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              {slogan || 'Crafting exceptional luxury fashion. Each piece tells a story of timeless elegance and unparalleled craftsmanship.'}
            </p>
            {socialLinks.length ? (
              <div className="flex flex-wrap gap-4">
                {socialLinks.map(({ name, href, Icon }) => (
                  <Link
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label={name}
                    title={name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 luxury-heading">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-gray-300 hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4 luxury-heading">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="text-gray-300 hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-300 hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-gray-300 hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/care" className="text-gray-300 hover:text-white transition-colors">
                  Care Instructions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactEmail ? (
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a className="text-gray-300 hover:text-white transition-colors" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </div>
            ) : (
              <div />
            )}
            {phoneNumber ? (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a className="text-gray-300 hover:text-white transition-colors" href={`tel:${phoneNumber}`}>
                  {phoneNumber}
                </a>
              </div>
            ) : (
              <div />
            )}
            {address ? (
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">{address}</span>
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            {resolvedCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
