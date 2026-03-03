'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function HeroBanner() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<{ dx: number; dy: number; scaleTo: number }>({
    dx: 0,
    dy: 0,
    scaleTo: 0.28,
  });
  const [desktopUrl, setDesktopUrl] = useState('');
  const [mobileUrl, setMobileUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json) return;
        setDesktopUrl(String(json.homeHeroDesktopUrl || ''));
        setMobileUrl(String(json.homeHeroMobileUrl || ''));
      } catch {}
    };
    void load();
  }, []);

  useEffect(() => {
    let rafId = 0;
    const maxScroll = 240;

    const measure = () => {
      const heroEl = heroRef.current;
      const targetEl = document.getElementById('nav-brand-target');
      if (!heroEl || !targetEl) return;

      const heroRect = heroEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const heroCx = heroRect.left + heroRect.width / 2;
      const heroCy = heroRect.top + heroRect.height / 2;
      const targetCx = targetRect.left + targetRect.width / 2;
      const targetCy = targetRect.top + targetRect.height / 2;
      const scaleTo = heroRect.height > 0 ? targetRect.height / heroRect.height : 0.28;

      setMetrics({
        dx: targetCx - heroCx,
        dy: targetCy - heroCy,
        scaleTo: Math.min(1, Math.max(0.12, scaleTo)),
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        setProgress(p);
      });
    };

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        measure();
      });
    };

    const start = () => {
      measure();
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
    };

    const startRaf = requestAnimationFrame(start);
    return () => {
      cancelAnimationFrame(startRaf);
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const style = useMemo(() => {
    const p = progress;
    const translateX = metrics.dx * p;
    const translateY = metrics.dy * p;
    const scale = 1 + (metrics.scaleTo - 1) * p;
    const opacity = p >= 1 ? 0 : Math.max(0, 1 - p * 1.15);

    return {
      transform: `translate(-50%, 0) translate(${translateX}px, ${translateY}px) scale(${scale})`,
      opacity,
    } as const;
  }, [metrics.dx, metrics.dy, metrics.scaleTo, progress]);

  const hasBackground = Boolean(desktopUrl || mobileUrl);

  return (
    <section className="relative h-screen bg-white">
      {hasBackground ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 hidden md:block">
            {desktopUrl ? (
              <Image src={desktopUrl} alt="Home hero background" fill className="object-cover" priority />
            ) : null}
          </div>
          <div className="absolute inset-0 md:hidden">
            {mobileUrl ? (
              <Image src={mobileUrl} alt="Home hero background" fill className="object-cover" priority />
            ) : desktopUrl ? (
              <Image src={desktopUrl} alt="Home hero background" fill className="object-cover" priority />
            ) : null}
          </div>
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50" />
      )}

      <div className="absolute inset-0">
        <div
          ref={heroRef}
          className="fixed left-1/2 top-[20vh] z-40 select-none pointer-events-none"
          style={style}
          aria-hidden
        >
          <div
            className={`luxury-heading font-extrabold !tracking-[0.15em] text-[clamp(5.9rem,12vw,11rem)] ${
              hasBackground ? 'text-white' : 'text-black'
            }`}
          >
            ODIN
          </div>
        </div>
      </div>
    </section>
  );
}
