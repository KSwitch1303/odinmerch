import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if ((message as string).trim().length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const res = await db.collection('contacts').insertOne({
      name: String(name).trim(),
      email: String(email).toLowerCase(),
      message: String(message).trim(),
      created_at: new Date(),
    });

    return NextResponse.json({ ok: true, id: res.insertedId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

