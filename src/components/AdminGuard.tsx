'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user ?? null;
      if (!user) {
        router.replace('/login?next=' + encodeURIComponent(pathname));
        return;
      }
      const email = user.email || '';
      const res = await fetch('/api/users/role?email=' + encodeURIComponent(email));
      if (!res.ok) {
        router.replace('/account');
        return;
      }
      const json = await res.json();
      if (json.role !== 'admin') {
        router.replace('/account');
        return;
      }
      setChecked(true);
    };
    check();
  }, [router, pathname]);

  if (!checked) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse h-8 bg-gray-200 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

