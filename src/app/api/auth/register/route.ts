import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      const message = (authError?.message || '').toLowerCase();
      if (authError?.status === 400 && message.includes('already')) {
        return NextResponse.json(
          { success: false, error: 'User already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user in MongoDB
    const client = await clientPromise;
    const db = client.db('luxury-ecommerce');
    
    const newUser: Omit<User, '_id'> = {
      email,
      name,
      role: 'customer',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...newUser,
          _id: result.insertedId.toString(),
        },
        session: authData.session,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
