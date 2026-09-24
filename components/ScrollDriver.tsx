'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { FILM_END } from '@/lib/film';
import { useFilm } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Wires scroll to the film clock and runs every DOM reveal. Renders nothing. */
export function ScrollDriver() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    const ctx = gsap.context(() => {
      // Film clock ------------------------------------------------------------
      ScrollTrigger.create({
        trigger: '#film',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => useFilm.setState({ t: self.progress * FILM_END }),
      });

      // Hand the finished vessel to the configurator
      ScrollTrigger.create({
        trigger: '#configure',
        start: 'top bottom',
        end: 'top 15%',
        onUpdate: (self) => useFilm.setState({ config: self.progress }),
      });

      // Pause WebGL once opaque sections cover it
      ScrollTrigger.create({
        trigger: '#configure',
        start: 'top top',
        end: 'bottom top',
        onLeave: () => useFilm.setState({ visible: false }),
        onEnterBack: () => useFilm.setState({ visible: true }),
      });

      // Chapter cards drift in and out while their chapter plays
      gsap.utils.toArray<HTMLElement>('.chapter').forEach((ch, i) => {
        const card = ch.querySelector('.chapter-card');
        if (!card || i === 0) return;
        gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 75%', end: 'bottom 25%', scrub: true } })
          .fromTo(card, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'none' })
          .to(card, { autoAlpha: 1, duration: 0.6 })
          .to(card, { autoAlpha: 0, y: -60, duration: 0.2, ease: 'none' });
      });
      const hero = document.querySelector('.chapter:first-child .chapter-card');
      if (hero) {
        gsap.to(hero, { autoAlpha: 0, y: -80, ease: 'none', scrollTrigger: { trigger: '#film', start: 'top top', end: () => `+=${window.innerHeight * 0.9}`, scrub: true } });
      }

      if (reduced) return;

      // Line-mask headline reveals
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.15,
              stagger: 0.08,
              ease: 'expo.out',
              scrollTrigger: el.closest('.chapter:first-child') ? undefined : { trigger: el, start: 'top 88%' },
            }),
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
        gsap.from(el, { autoAlpha: 0, y: 24, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
      });
    });

    document.documentElement.classList.add('js-ready');

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return null;
}

/** Smooth-scroll to a section, respecting Lenis when present. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
  else el.scrollIntoView({ behavior: 'smooth' });
}
