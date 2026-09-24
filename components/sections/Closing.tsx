'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { COMPANY, INSPECTORS, PRODUCTS } from '@/lib/content';

export function Products() {
  return (
    <section id="products" className="sheet products" aria-labelledby="products-title">
      <header className="sheet-head">
        <p className="kicker mono"><span className="kicker-num">10</span> Product lines</p>
        <h2 id="products-title" className="display display--md" data-split>
          Ten lines. <em>One</em> standard.
        </h2>
        <p className="lede">Every line ships with material test certificates (EN 10204 3.1) and full non-destructive examination.</p>
      </header>
      <ol className="index">
        {PRODUCTS.map((p, i) => (
          <li key={p.name} className="index-row" data-fade>
            <span className="index-num mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="index-name">{p.name}</span>
            <span className="index-group mono">{p.group}</span>
            <span className="index-code mono">{p.code}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Works() {
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onPrefill = (e: Event) => setNote((e as CustomEvent<string>).detail);
    window.addEventListener('rfq:prefill', onPrefill);
    return () => window.removeEventListener('rfq:prefill', onPrefill);
  }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = [
      'RFQ — SkyUdaan En-Fab',
      `Name: ${f.get('name')}`,
      `Company: ${f.get('company')}`,
      `Phone: ${f.get('phone')}`,
      '',
      String(f.get('note') || ''),
    ].join('\n');
    window.open(`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <section id="works" className="sheet works" aria-labelledby="works-title">
      <div className="works-copy">
        <p className="kicker mono"><span className="kicker-num">11</span> Heavy engineering works</p>
        <h2 id="works-title" className="display display--md" data-split>
          Come and <em>inspect</em> the works.
        </h2>
        <p className="lede">
          Plate rolling, automatic submerged arc welding lines and overhead crane handling in Yelahanka, Bengaluru. Client QA engineers and third-party inspectors are welcome for stage-wise inspection.
        </p>
        <ul className="inspectors mono" aria-label="Third-party inspection agencies welcome">
          {INSPECTORS.map((n) => <li key={n}>{n}</li>)}
        </ul>
        <dl className="specs specs--wide">
          <div><dt className="mono">Works</dt><dd>{COMPANY.address.map((l) => <span key={l}>{l}<br /></span>)}</dd></div>
          <div><dt className="mono">Executive contact</dt><dd>{COMPANY.ceo}, CEO<br /><a href={COMPANY.phoneHref}>{COMPANY.phone}</a></dd></div>
        </dl>
      </div>

      <form id="rfq" className="rfq" onSubmit={submit} aria-labelledby="rfq-title">
        <h3 id="rfq-title" className="rfq-title">Request a quote</h3>
        <p className="fine">Your request opens in WhatsApp, addressed to our estimating cell. Nothing is sent until you press send there.</p>
        <label>
          <span className="mono">Name & designation</span>
          <input name="name" required autoComplete="name" placeholder="e.g. Project engineer" />
        </label>
        <label>
          <span className="mono">Company</span>
          <input name="company" required autoComplete="organization" />
        </label>
        <label>
          <span className="mono">Phone / WhatsApp</span>
          <input name="phone" required type="tel" autoComplete="tel" inputMode="tel" />
        </label>
        <label>
          <span className="mono">Duty, capacity, codes</span>
          <textarea name="note" rows={6} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Medium, capacity, design pressure, MOC, codes, site…" />
        </label>
        <button className="btn btn--ink btn--wide" type="submit">Continue in WhatsApp →</button>
        {sent && <p className="fine" role="status">WhatsApp opened in a new tab. If it didn’t, call <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>.</p>}
      </form>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-mark" aria-hidden>SkyUdaan</p>
      <div className="footer-grid mono small">
        <span>{COMPANY.legal}</span>
        <span>{COMPANY.codes}</span>
        <span>CIN {COMPANY.cin}</span>
        <span>GST {COMPANY.gst}</span>
        <span>© {new Date().getFullYear()} · Yelahanka, Bengaluru</span>
      </div>
    </footer>
  );
}
