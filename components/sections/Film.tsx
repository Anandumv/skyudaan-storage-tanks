'use client';

import { useEffect, useRef } from 'react';
import { CHAPTER_COPY, COMPANY, NUMBERS } from '@/lib/content';
import { CHAPTERS, seg } from '@/lib/film';
import { useFilm } from '@/lib/store';
import { scrollToId } from '../ScrollDriver';

const pad = (n: number) => String(n).padStart(2, '0');

/** Radiograph strip: the weld seam as a film negative, scanned as the X-ray ring passes. */
function Radiograph() {
  const scan = useRef<SVGRectElement>(null);
  const stamp = useRef<SVGGElement>(null);
  useEffect(
    () =>
      useFilm.subscribe(({ t }) => {
        const p = seg(t, 4.08, 4.92);
        scan.current?.setAttribute('width', String(p * 520));
        if (stamp.current) stamp.current.style.opacity = p >= 1 ? '1' : '0';
      }),
    [],
  );
  return (
    <figure className="radiograph" aria-label="Illustration of a weld radiograph">
      <svg viewBox="0 0 520 110" role="img" aria-hidden>
        <defs>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
            <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.88  0 0 0 0 1  0 0 0 0.35 0" />
          </filter>
          <linearGradient id="bead" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d3bff" stopOpacity="0" />
            <stop offset=".5" stopColor="#dfe5ff" />
            <stop offset="1" stopColor="#1d3bff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="scanClip">
            <rect ref={scan} x="0" y="0" width="0" height="110" />
          </clipPath>
        </defs>
        <rect width="520" height="110" fill="#0a1233" />
        <g clipPath="url(#scanClip)">
          <rect width="520" height="110" fill="#0f1c5c" />
          <rect y="38" width="520" height="34" fill="url(#bead)" opacity=".85" />
          <path d="M0 55 Q 20 49 40 55 T 80 55 T 120 55 T 160 55 T 200 55 T 240 55 T 280 55 T 320 55 T 360 55 T 400 55 T 440 55 T 480 55 T 520 55" stroke="#fff" strokeOpacity=".5" fill="none" />
          <rect width="520" height="110" filter="url(#grain)" />
          {[60, 180, 300, 420].map((x, i) => (
            <text key={x} x={x} y="98" fill="#aab6ff" fontSize="10" fontFamily="var(--font-mono)">RT-{pad(i + 1)}</text>
          ))}
        </g>
        <g ref={stamp} className="radiograph-stamp">
          <rect x="360" y="12" width="148" height="26" rx="2" fill="none" stroke="#fff" />
          <text x="434" y="29" textAnchor="middle" fill="#fff" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.5">UW-51 · CLEAR</text>
        </g>
      </svg>
      <figcaption>Radiograph, illustrative</figcaption>
    </figure>
  );
}

/** Hydrotest gauge: needle climbs to 1.5 × MAWP, then the hold clock runs. */
function Gauge() {
  const needle = useRef<SVGLineElement>(null);
  const hold = useRef<SVGCircleElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      useFilm.subscribe(({ t }) => {
        const p = seg(t, 6.15, 6.6);
        const h = seg(t, 6.6, 6.95);
        // dial spans -120° → +120° for 0 → 2 × MAWP
        needle.current?.setAttribute('transform', `rotate(${-120 + p * 0.75 * 240} 60 60)`);
        hold.current?.setAttribute('stroke-dashoffset', String(214 * (1 - h)));
        if (readout.current) readout.current.textContent = `${(p * 1.5).toFixed(2)} × MAWP · hold ${Math.round(h * 4 * 60)} min`;
      }),
    [],
  );
  const ticks = Array.from({ length: 21 }, (_, i) => -120 + i * 12);
  return (
    <div className="gauge" aria-hidden>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="56" fill="none" stroke="var(--hair)" />
        <circle ref={hold} cx="60" cy="60" r="34" fill="none" stroke="var(--cobalt)" strokeWidth="2" strokeDasharray="214" strokeDashoffset="214" transform="rotate(-90 60 60)" />
        {ticks.map((a, i) => (
          <line key={a} x1="60" y1={i % 5 ? 10 : 7} x2="60" y2="15" stroke={a === 60 ? 'var(--cobalt)' : 'var(--ink)'} strokeWidth={a === 60 ? 2 : 0.8} transform={`rotate(${a} 60 60)`} />
        ))}
        <text x="98" y="92" fontSize="7" fill="var(--cobalt)" fontFamily="var(--font-mono)">1.5×</text>
        <line ref={needle} x1="60" y1="60" x2="60" y2="16" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" transform="rotate(-120 60 60)" />
        <circle cx="60" cy="60" r="3.5" fill="var(--ink)" />
      </svg>
      <span ref={readout} className="mono small">0.00 × MAWP · hold 0 min</span>
    </div>
  );
}

function Numbers() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(
    () =>
      useFilm.subscribe(({ t }) => {
        const p = seg(t, 8.05, 8.6);
        const e = 1 - Math.pow(1 - p, 3);
        NUMBERS.forEach((n, i) => {
          const el = refs.current[i];
          if (el) el.textContent = String(Math.round(n.value * e));
        });
      }),
    [],
  );
  return (
    <dl className="numbers">
      {NUMBERS.map((n, i) => (
        <div key={n.label}>
          <dt className="mono small">{n.label}</dt>
          <dd>
            <span ref={(el) => { refs.current[i] = el; }}>{n.value}</span>
            <small>{n.unit}</small>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Film() {
  return (
    <section id="film" aria-label="How a SkyUdaan vessel is made" data-cursor="Scroll">
      {CHAPTER_COPY.map((c, i) => {
        const Heading = i === 0 ? 'h1' : 'h2';
        return (
          <article key={CHAPTERS[i].id} className={`chapter chapter--${CHAPTERS[i].id}`} id={`ch-${CHAPTERS[i].id}`}>
            <div className="chapter-sticky">
              <div className="chapter-card">
                <p className="kicker mono">
                  <span className="kicker-num">{pad(i)}</span> {c.kicker}
                </p>
                <Heading className={i === 0 ? 'display hero-rise' : 'display'} data-split={i === 0 ? undefined : ''}>
                  {i === 0 ? (
                    <>
                      Every vessel begins as a <em>flat plate.</em>
                    </>
                  ) : (
                    c.title
                  )}
                </Heading>
                <p className={i === 0 ? 'lede hero-rise-late' : 'lede'}>{c.body}</p>
                {c.specs.length > 0 && (
                  <dl className="specs">
                    {c.specs.map(([k, v]) => (
                      <div key={k}>
                        <dt className="mono">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {c.gain && (
                  <p className="gain">
                    <span className="mono">For your plant</span>
                    {c.gain}
                  </p>
                )}
                {CHAPTERS[i].id === 'dispatch' && (
                  <div className="cta-row">
                    <button className="btn btn--ink" onClick={() => scrollToId('configure')}>This one could be yours →</button>
                  </div>
                )}
                {i === 0 && (
                  <div className="cta-row">
                    <button className="btn btn--ink" onClick={() => scrollToId('configure')}>Configure a vessel</button>
                    <button className="btn btn--line" onClick={() => scrollToId('rfq')}>Request a quote</button>
                  </div>
                )}
                {CHAPTERS[i].id === 'xray' && <Radiograph />}
                {CHAPTERS[i].id === 'hydro' && <Gauge />}
                {CHAPTERS[i].id === 'dispatch' && <Numbers />}
              </div>
              {i === 0 && (
                <div className="hero-meta mono" aria-hidden>
                  <span>{COMPANY.codes}</span>
                  <span className="scroll-cue">Scroll to fabricate ↓</span>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
