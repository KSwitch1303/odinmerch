import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

async function getEmailFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.email || null;
}

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

function isAdminEmail(email: string) {
  const adminsEnv = process.env.ADMIN_EMAILS || '';
  const adminList = adminsEnv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return adminList.includes(email.toLowerCase());
}

function safeFileName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, '-');
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '');
}

function safePrefix(prefix: string) {
  const cleaned = prefix
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, ''))
    .filter(Boolean)
    .join('/');
  return cleaned ? `${cleaned}/` : '';
}

async function deleteAllObjectsInFolder(params: {
  supabaseUpload: SupabaseClient;
  bucket: string;
  folder: string;
}) {
  const { supabaseUpload, bucket, folder } = params;
  const storage = supabaseUpload.storage.from(bucket);

  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await storage.list(folder, { limit, offset });
    if (error || !data || data.length === 0) return;

    const pathsToRemove = (data as Array<{ name?: string }>)
      .filter((entry) => entry && typeof entry.name === 'string' && entry.name.length > 0)
      .map((entry) => `${folder}/${entry.name}`);

    if (pathsToRemove.length > 0) {
      await storage.remove(pathsToRemove);
    }

    if (data.length < limit) return;
    offset += limit;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const email = await getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminEmail(email)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const prefix = safePrefix(String(formData.get('path') || ''));
    const replaceExisting = String(formData.get('replaceExisting') || '') === '1';
    const timestamp = Date.now();
    const filename = `${prefix}${timestamp}-${safeFileName(file.name) || 'upload'}`;
    const bucket = process.env.SUPABASE_UPLOAD_BUCKET || 'products';

    const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const supabaseUpload = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: !supabaseServiceKey && token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    });

    if (replaceExisting && prefix === 'brand/') {
      await deleteAllObjectsInFolder({ supabaseUpload, bucket, folder: 'brand' });
    }

    const { error } = await supabaseUpload.storage
      .from(bucket)
      .upload(filename, file, { contentType: file.type || undefined });

    if (error) {
      if (error.message.toLowerCase().includes('bucket not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bucket not found',
            code: 'bucket_not_found',
            bucket,
            detail: `Create a Supabase Storage bucket named "${bucket}".`,
          },
          { status: 400 }
        );
      }
      if (error.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Storage permission denied',
            code: 'storage_rls',
            detail: supabaseServiceKey
              ? 'Storage policies are blocking inserts despite service key; check bucket and policies.'
              : 'Supabase Storage RLS blocked the upload. Add SUPABASE_SERVICE_ROLE_KEY on the server or create a Storage insert policy for this bucket.',
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseUpload.storage
      .from(bucket)
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
