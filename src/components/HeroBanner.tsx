'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function HeroBanner() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<{ dx: number; dy: number; scaleTo: number }>({
    dx: 0,
    dy: 0,
    scaleTo: 0.28,
  });
  const [desktopUrls, setDesktopUrls] = useState<string[]>([]);
  const [mobileUrls, setMobileUrls] = useState<string[]>([]);
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [desktopDirection, setDesktopDirection] = useState<1 | -1>(1);
  const [mobileDirection, setMobileDirection] = useState<1 | -1>(1);
  const [brandName, setBrandName] = useState('ODIN');
  const [slogan, setSlogan] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (!json) return;
        const nextDesktopUrls = Array.isArray(json.homeHeroDesktopUrls)
          ? json.homeHeroDesktopUrls.filter((v: unknown) => typeof v === 'string' && v.length > 0)
          : typeof json.homeHeroDesktopUrl === 'string' && json.homeHeroDesktopUrl
            ? [json.homeHeroDesktopUrl]
            : [];
        const nextMobileUrls = Array.isArray(json.homeHeroMobileUrls)
          ? json.homeHeroMobileUrls.filter((v: unknown) => typeof v === 'string' && v.length > 0)
          : typeof json.homeHeroMobileUrl === 'string' && json.homeHeroMobileUrl
            ? [json.homeHeroMobileUrl]
            : [];

        setDesktopUrls(nextDesktopUrls);
        setMobileUrls(nextMobileUrls);
        setDesktopIndex(0);
        setMobileIndex(0);
        setBrandName(String(json.businessName || 'ODIN'));
        setSlogan(String(json.slogan || ''));
      } catch {}
    };
    void load();
  }, []);

  useEffect(() => {
    if (desktopUrls.length <= 1) return;
    const id = window.setInterval(() => {
      setDesktopDirection(1);
      setDesktopIndex((prev) => (prev + 1) % desktopUrls.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [desktopUrls.length]);

  const effectiveMobileUrls = mobileUrls.length > 0 ? mobileUrls : desktopUrls;

  useEffect(() => {
    if (effectiveMobileUrls.length <= 1) return;
    const id = window.setInterval(() => {
      setMobileDirection(1);
      setMobileIndex((prev) => (prev + 1) % effectiveMobileUrls.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [effectiveMobileUrls.length]);

  const safeDesktopIndex = desktopUrls.length > 0 ? desktopIndex % desktopUrls.length : 0;
  const safeMobileIndex = effectiveMobileUrls.length > 0 ? mobileIndex % effectiveMobileUrls.length : 0;

  const swipeConfidenceThreshold = 8000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const paginateDesktop = (direction: 1 | -1) => {
    if (desktopUrls.length <= 1) return;
    setDesktopDirection(direction);
    setDesktopIndex((prev) => (prev + direction + desktopUrls.length) % desktopUrls.length);
  };

  const paginateMobile = (direction: 1 | -1) => {
    if (effectiveMobileUrls.length <= 1) return;
    setMobileDirection(direction);
    setMobileIndex((prev) => (prev + direction + effectiveMobileUrls.length) % effectiveMobileUrls.length);
  };

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

  const brandStyle = useMemo(() => {
    const p = progress;
    const translateX = metrics.dx * p;
    const translateY = metrics.dy * p;
    const scale = 1 + (metrics.scaleTo - 1) * p;
    const opacity = p >= 1 ? 0 : Math.max(0, 1 - p * 1.15);

    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      opacity,
    } as const;
  }, [metrics.dx, metrics.dy, metrics.scaleTo, progress]);

  const sloganOpacity = useMemo(() => {
    const p = progress;
    return p >= 1 ? 0 : Math.max(0, 1 - p * 1.15);
  }, [progress]);

  const hasBackground = desktopUrls.length > 0 || mobileUrls.length > 0;

  return (
    <section className="relative h-screen bg-white">
      {hasBackground ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 hidden md:block overflow-hidden">
            <AnimatePresence mode="wait" custom={desktopDirection}>
              {desktopUrls.length > 0 ? (
                <motion.div
                  key={desktopUrls[safeDesktopIndex] || `desktop-${safeDesktopIndex}`}
                  className="absolute inset-0"
                  custom={desktopDirection}
                  initial={(direction: 1 | -1) => ({ x: direction > 0 ? 120 : -120, opacity: 0 })}
                  animate={{ x: 0, opacity: 1 }}
                  exit={(direction: 1 | -1) => ({ x: direction > 0 ? -120 : 120, opacity: 0 })}
                  transition={{
                    x: { type: 'spring', stiffness: 260, damping: 28 },
                    opacity: { duration: 0.35 },
                  }}
                  drag={desktopUrls.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      paginateDesktop(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                      paginateDesktop(-1);
                    }
                  }}
                  style={{ touchAction: 'pan-y' }}
                >
                  <Image
                    src={desktopUrls[safeDesktopIndex] as string}
                    alt="Home hero background"
                    fill
                    className="object-cover"
                    priority={safeDesktopIndex === 0}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            {desktopUrls.length > 1 ? (
              <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                {desktopUrls.map((_, idx) => (
                  <button
                    key={`desktop-dot-${idx}`}
                    type="button"
                    aria-label={`Go to hero image ${idx + 1}`}
                    onClick={() => {
                      if (idx === safeDesktopIndex) return;
                      setDesktopDirection(idx > safeDesktopIndex ? 1 : -1);
                      setDesktopIndex(idx);
                    }}
                    className={`h-2.5 w-2.5 rounded-full transition-opacity ${
                      idx === safeDesktopIndex ? 'bg-white opacity-100' : 'bg-white/70 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className="absolute inset-0 md:hidden overflow-hidden">
            <AnimatePresence mode="wait" custom={mobileDirection}>
              {effectiveMobileUrls.length > 0 ? (
                <motion.div
                  key={effectiveMobileUrls[safeMobileIndex] || `mobile-${safeMobileIndex}`}
                  className="absolute inset-0"
                  custom={mobileDirection}
                  initial={(direction: 1 | -1) => ({ x: direction > 0 ? 90 : -90, opacity: 0 })}
                  animate={{ x: 0, opacity: 1 }}
                  exit={(direction: 1 | -1) => ({ x: direction > 0 ? -90 : 90, opacity: 0 })}
                  transition={{
                    x: { type: 'spring', stiffness: 260, damping: 28 },
                    opacity: { duration: 0.35 },
                  }}
                  drag={effectiveMobileUrls.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      paginateMobile(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                      paginateMobile(-1);
                    }
                  }}
                  style={{ touchAction: 'pan-y' }}
                >
                  <Image
                    src={effectiveMobileUrls[safeMobileIndex] as string}
                    alt="Home hero background"
                    fill
                    className="object-cover"
                    priority={safeMobileIndex === 0}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            {effectiveMobileUrls.length > 1 ? (
              <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                {effectiveMobileUrls.map((_, idx) => (
                  <button
                    key={`mobile-dot-${idx}`}
                    type="button"
                    aria-label={`Go to hero image ${idx + 1}`}
                    onClick={() => {
                      if (idx === safeMobileIndex) return;
                      setMobileDirection(idx > safeMobileIndex ? 1 : -1);
                      setMobileIndex(idx);
                    }}
                    className={`h-2.5 w-2.5 rounded-full transition-opacity ${
                      idx === safeMobileIndex ? 'bg-white opacity-100' : 'bg-white/70 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50" />
      )}

      <div className="absolute inset-0">
        <div className="fixed left-1/2 top-[20vh] z-40 select-none pointer-events-none -translate-x-1/2 text-center" aria-hidden>
          <div
            ref={heroRef}
            style={brandStyle}
            className={`luxury-heading font-extrabold !tracking-[0.15em] text-[clamp(5.9rem,12vw,11rem)] ${
              hasBackground ? 'text-white' : 'text-black'
            }`}
          >
            {brandName}
          </div>
          {slogan ? (
            <div
              style={{ opacity: sloganOpacity }}
              className={`${hasBackground ? 'text-white/90' : 'text-black/80'} mt-3 text-[clamp(1rem,2vw,1.35rem)] tracking-[0.28em] uppercase`}
            >
              {slogan}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
