import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type BrandSettings = {
  _id: 'brand';
  businessName?: string;
  logoUrl?: string;
  homeHeroDesktopUrl?: string;
  homeHeroMobileUrl?: string;
  slogan?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  copyrightText?: string;
  updated_at?: Date;
};

function sanitizeErrorMessage(message: string) {
  return message.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb://***@');
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getEmailFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.email || null;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (/tls|ssl/i.test(message)) {
      await delay(250);
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return null;
        return data.user.email || null;
      } catch (retryError) {
        const retryMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
        throw new Error(`Supabase auth failed: ${retryMessage}`);
      }
    }
    throw new Error(`Supabase auth failed: ${message}`);
  }
}

async function isAdminEmail(email: string) {
  const adminsEnv = process.env.ADMIN_EMAILS || '';
  const adminList = adminsEnv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminList.includes(email.toLowerCase())) return true;

  try {
    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    return user?.role === 'admin';
  } catch (e) {
    const message = e instanceof Error ? sanitizeErrorMessage(e.message) : 'Unknown error';
    throw new Error(`MongoDB admin check failed: ${message}`);
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const doc = await db.collection<BrandSettings>('settings').findOne({ _id: 'brand' });
    return NextResponse.json({
      businessName: doc?.businessName || 'ODIN',
      logoUrl: doc?.logoUrl || '',
      homeHeroDesktopUrl: doc?.homeHeroDesktopUrl || '',
      homeHeroMobileUrl: doc?.homeHeroMobileUrl || '',
      slogan: doc?.slogan || '',
      facebookUrl: doc?.facebookUrl || '',
      instagramUrl: doc?.instagramUrl || '',
      twitterUrl: doc?.twitterUrl || '',
      tiktokUrl: doc?.tiktokUrl || '',
      youtubeUrl: doc?.youtubeUrl || '',
      linkedinUrl: doc?.linkedinUrl || '',
      contactEmail: doc?.contactEmail || '',
      phoneNumber: doc?.phoneNumber || '',
      address: doc?.address || '',
      copyrightText: doc?.copyrightText || '',
    });
  } catch (e) {
    return NextResponse.json({
      businessName: 'ODIN',
      logoUrl: '',
      homeHeroDesktopUrl: '',
      homeHeroMobileUrl: '',
      slogan: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      tiktokUrl: '',
      youtubeUrl: '',
      linkedinUrl: '',
      contactEmail: '',
      phoneNumber: '',
      address: '',
      copyrightText: '',
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      businessName,
      logoUrl,
      homeHeroDesktopUrl,
      homeHeroMobileUrl,
      slogan,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      tiktokUrl,
      youtubeUrl,
      linkedinUrl,
      contactEmail,
      phoneNumber,
      address,
      copyrightText,
    } = await request.json();
    try {
      const client = await clientPromise;
      const db = client.db('luxury-ecommerce');
      await db.collection<BrandSettings>('settings').updateOne(
        { _id: 'brand' },
        {
          $set: {
            businessName: String(businessName || 'ODIN'),
            logoUrl: String(logoUrl || ''),
            homeHeroDesktopUrl: String(homeHeroDesktopUrl || ''),
            homeHeroMobileUrl: String(homeHeroMobileUrl || ''),
            slogan: String(slogan || ''),
            facebookUrl: String(facebookUrl || ''),
            instagramUrl: String(instagramUrl || ''),
            twitterUrl: String(twitterUrl || ''),
            tiktokUrl: String(tiktokUrl || ''),
            youtubeUrl: String(youtubeUrl || ''),
            linkedinUrl: String(linkedinUrl || ''),
            contactEmail: String(contactEmail || ''),
            phoneNumber: String(phoneNumber || ''),
            address: String(address || ''),
            copyrightText: String(copyrightText || ''),
            updated_at: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (e) {
      const message = e instanceof Error ? sanitizeErrorMessage(e.message) : 'Unknown error';
      throw new Error(`MongoDB settings save failed: ${message}`);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? sanitizeErrorMessage(e.message) : '';
    return NextResponse.json(
      process.env.NODE_ENV === 'production'
        ? { error: 'Server error' }
        : { error: 'Server error', detail: message || 'Unknown error' },
      { status: 500 }
    );
  }
}
