'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// WebGL is client-only and starts once the page is idle, so it never competes with first paint.
const Stage = dynamic(() => import('./Stage'), { ssr: false });

export function StageMount() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const go = () => setReady(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 200);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="stage" aria-hidden>
      {ready && <Stage />}
    </div>
  );
}
