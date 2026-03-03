'use client';

import { useEffect, useState } from 'react';

export default function BrandHead() {
  const [name, setName] = useState('');
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        const n = json.businessName || 'ODIN';
        setName(n);
        document.title = n;
      }
    };
    load();
  }, []);
  return null;
}
