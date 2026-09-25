'use client';

import { useEffect, useRef, useState } from 'react';
import { sound } from '@/lib/audio';
import { calculate, configCode, formatNum } from '@/lib/engineering';
import { useFilm } from '@/lib/store';
import { AnimatedInr, specSummary } from '../sections/Configurator';
import { scrollToId } from '../ScrollDriver';

const KEY = 'su-entered';

function enter(withSound: boolean) {
  if (withSound) {
    sound.start();
    sound.setMuted(false);
  }
  useFilm.setState({ entered: true, sound: withSound });
  document.documentElement.classList.add('entered');
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {}
}

/** Entry gate: counts the plate in, waits for WebGL, then asks how to enter. */
export function Gate() {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let skip = false;
    try {
      skip = sessionStorage.getItem(KEY) === '1';
    } catch {}
    if (skip || window.location.hash) {
      enter(false);
      setGone(true);
      return;
    }
    document.documentElement.classList.add('gated');
    const t0 = performance.now();
    let raf = 0;
    let shown = 0;
    const loop = (now: number) => {
      const stage = useFilm.getState().stageReady || now - t0 > 6000;
      // eases toward 88 on its own; the last stretch waits for the first WebGL frame
      const target = stage ? 100 : Math.min(88, ((now - t0) / 1600) * 88);
      shown += (target - shown) * 0.08;
      const v = Math.min(100, Math.round(shown + 0.4));
      if (count.current) count.current.textContent = String(v).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`;
      if (v >= 100) {
        setReady(true);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (ready) primary.current?.focus({ preventScroll: true });
  }, [ready]);

  const go = (withSound: boolean) => {
    enter(withSound);
    document.documentElement.classList.remove('gated');
    setLeaving(true);
    setTimeout(() => setGone(true), 1100);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !gone && go(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (gone) return null;
  return (
    <div className={leaving ? 'gate is-leaving' : 'gate'} role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-top mono">
        <span>SkyUdaan En-Fab</span>
        <span>Yelahanka works · Bengaluru</span>
      </div>
      <div className="gate-center">
        <p className="mono gate-kicker">A film in nine operations</p>
        <h2 id="gate-title" className="gate-title">
          Birth of a <em>vessel</em>
        </h2>
        <div className="gate-meter mono" aria-hidden>
          <span>Rolling plate</span>
          <span className="gate-track"><span ref={bar} /></span>
          <span ref={count}>000</span>
        </div>
      </div>
      <div className={ready ? 'gate-actions is-ready' : 'gate-actions'}>
        <button ref={primary} className="btn btn--ink" onClick={() => go(true)} data-cursor="Enter">
          Enter with sound
        </button>
        <button className="btn btn--line" onClick={() => go(false)}>
          Enter quietly
        </button>
        <span className="mono gate-hint">Best with headphones</span>
      </div>
    </div>
  );
}

/** Drives the soundscape from the film clock. */
export function SoundLoop() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const s = useFilm.getState();
      if (s.sound) sound.update(s.t, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => sound.setMuted(document.hidden || !useFilm.getState().sound);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return null;
}

export function SoundToggle() {
  const on = useFilm((s) => s.sound);
  const toggle = () => {
    const next = !on;
    if (next) sound.start();
    sound.setMuted(!next);
    useFilm.setState({ sound: next });
  };
  return (
    <button className={on ? 'sound is-on' : 'sound'} onClick={toggle} aria-pressed={on} aria-label={on ? 'Sound on' : 'Sound off'}>
      <span className="sound-bars" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="mono sound-label">{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}

/** Ring cursor with contextual labels from the nearest [data-cursor]. Fine pointers only. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: p.x, y: p.y };
    let raf = 0;
    let text = '';
    const probe = () => {
      const el = document.elementFromPoint(p.x, p.y);
      const tagged = el?.closest?.('[data-cursor]') as HTMLElement | null;
      const link = el?.closest?.('a, button, label, [role="button"]');
      const field = el?.closest?.('input[type="text"], input[type="tel"], input:not([type]), textarea');
      const next = tagged?.dataset.cursor ?? '';
      if (next !== text && label.current) label.current.textContent = text = next;
      ring.current?.classList.toggle('is-label', !!next);
      ring.current?.classList.toggle('is-link', !next && !!link);
      document.documentElement.classList.toggle('cursor-hidden', !!field);
    };
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      probe();
    };
    // content moves under a still pointer while scrolling or when the gate lifts
    const probeTimer = setInterval(probe, 250);
    const onDown = () => ring.current?.classList.add('is-down');
    const onUp = () => ring.current?.classList.remove('is-down');
    const loop = () => {
      r.x += (p.x - r.x) * 0.18;
      r.y += (p.y - r.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(probeTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span ref={label} className="mono" />
      </div>
    </>
  );
}

/** Follows the visitor once they have a vessel configured, until they reach the quote form. */
export function QuoteBar() {
  const vessel = useFilm((s) => s.vessel);
  const past = useFilm((s) => s.config > 0.98);
  const [atForm, setAtForm] = useState(false);
  const [inConfig, setInConfig] = useState(false);
  useEffect(() => {
    const works = document.getElementById('works');
    const cfg = document.getElementById('configure');
    if (!works || !cfg) return;
    const io = new IntersectionObserver(([e]) => setAtForm(e.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    // the configurator carries its own quote button
    const io2 = new IntersectionObserver(([e]) => setInConfig(e.isIntersecting), { rootMargin: '0px 0px -40% 0px' });
    io.observe(works);
    io2.observe(cfg);
    return () => {
      io.disconnect();
      io2.disconnect();
    };
  }, []);
  const r = calculate(vessel);
  const show = past && !inConfig && !atForm;
  return (
    <aside className={show ? 'quotebar is-on' : 'quotebar'} aria-hidden={!show} aria-label="Your configured vessel">
      <span className="mono quotebar-code">{configCode(vessel)}</span>
      <span className="quotebar-spec">
        {formatNum(vessel.capacityLiters)} L · Ø {formatNum(r.diameterMm)} × {formatNum(r.lengthMm)} mm
      </span>
      <span className="quotebar-price"><AnimatedInr value={r.estPriceInr} /></span>
      <button
        className="btn btn--ink btn--sm"
        tabIndex={show ? 0 : -1}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('rfq:prefill', { detail: specSummary(vessel) }));
          scrollToId('rfq');
        }}
      >
        Get firm quote →
      </button>
    </aside>
  );
}
