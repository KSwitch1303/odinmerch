import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHostname = '';
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';
} catch {
  supabaseHostname = '';
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'trae-api-sg.mchost.guru',
        pathname: '/api/ide/v1/text_to_image/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
