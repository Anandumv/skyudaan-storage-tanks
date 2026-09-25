'use client';

import { useEffect, useRef, useState } from 'react';
import { CHAPTERS, FILM_END } from '@/lib/film';
import { useFilm } from '@/lib/store';
import { scrollToId } from '../ScrollDriver';
import { SoundToggle } from './Experience';

const LINKS = [
  ['film', 'Process'],
  ['configure', 'Configure'],
  ['products', 'Products'],
  ['works', 'Works'],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };
  return (
    <header className="nav">
      <a href="#film" className="wordmark" onClick={(e) => { e.preventDefault(); go('film'); }}>
        <span className="wordmark-sky">SkyUdaan</span>
        <span className="wordmark-sub mono">En-Fab · Bengaluru</span>
      </a>
      <nav aria-label="Primary" className={open ? 'nav-links is-open' : 'nav-links'}>
        {LINKS.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>
            {label}
          </a>
        ))}
      </nav>
      <SoundToggle />
      <a href="#rfq" className="btn btn--ink btn--sm" onClick={(e) => { e.preventDefault(); go('rfq'); }}>
        Request quote
      </a>
      <button className="nav-toggle" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        <span />
        <span />
      </button>
    </header>
  );
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#·';

/** Instrument-style text scramble that resolves left to right. */
function scramble(el: HTMLElement, text: string) {
  const start = performance.now();
  const run = (now: number) => {
    const p = Math.min(1, (now - start) / 420);
    const fixed = Math.floor(p * text.length);
    el.textContent = text
      .split('')
      .map((c, i) => (i < fixed || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join('');
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

/** Fixed chapter index + progress ticks + mm ruler, visible only while the film plays. */
export function Hud() {
  const chapter = useFilm((s) => Math.min(Math.floor(s.t), FILM_END - 1));
  const hidden = useFilm((s) => s.config > 0.05 || s.t < 0.85 || s.t > 8.05);
  const bar = useRef<HTMLSpanElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (label.current) scramble(label.current, CHAPTERS[chapter].label.toUpperCase());
  }, [chapter]);

  useEffect(
    () =>
      useFilm.subscribe(({ t }) => {
        if (bar.current) bar.current.style.transform = `scaleX(${t / FILM_END})`;
        if (ruler.current) ruler.current.style.transform = `translateY(${-t * 120}px)`;
      }),
    [],
  );

  return (
    <div className={hidden ? 'hud is-hidden' : 'hud'} aria-hidden>
      <div className="hud-index mono">
        <span className="hud-num">{String(chapter).padStart(2, '0')}</span>
        <span className="hud-of">/ {String(FILM_END - 1).padStart(2, '0')}</span>
        <span ref={label} className="hud-label">{CHAPTERS[0].label}</span>
      </div>
      <div className="hud-track">
        <span ref={bar} className="hud-bar" />
        {CHAPTERS.map((c, i) => (
          <i key={c.id} style={{ left: `${(i / FILM_END) * 100}%` }} className={i <= chapter ? 'on' : ''} />
        ))}
      </div>
      <div className="hud-ruler">
        <div ref={ruler} className="hud-ruler-inner" />
      </div>
    </div>
  );
}
