import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }
    const adminsEnv = process.env.ADMIN_EMAILS || '';
    const adminList = adminsEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (adminList.includes(email.toLowerCase())) {
      return NextResponse.json({ role: 'admin' }, { status: 200 });
    }
    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ role: 'customer' }, { status: 200 });
    }
    return NextResponse.json({ role: user.role || 'customer' }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
