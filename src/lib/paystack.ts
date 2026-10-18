import crypto from 'crypto';

const PAYSTACK_API = 'https://api.paystack.co';

export type PaystackTransaction = {
  status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'pending' | 'processing' | 'queued' | 'reversed';
  reference: string;
  amount: number; // in kobo
  currency: string;
  paid_at?: string | null;
};

function getSecretKey() {
  const key = String(process.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!key) {
    throw new Error('Missing environment variable: "PAYSTACK_SECRET_KEY"');
  }
  return key;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) {
    throw new Error(`Paystack ${path} failed: ${json?.message || res.status}`);
  }
  return json.data as T;
}

export function toKobo(amount: number) {
  return Math.round(amount * 100);
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackRequest<{ authorization_url: string; access_code: string; reference: string }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        currency: 'NGN',
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
    }
  );
}

export async function verifyTransaction(reference: string) {
  return paystackRequest<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha512', getSecretKey()).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
