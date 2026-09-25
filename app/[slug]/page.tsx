import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COMPANY, INCLUDED, PRODUCTS } from '@/lib/content';
import { CAPACITY_STOPS, MOCS, ORIENTATIONS, calculate, defaultConfig, encodeConfig, formatInr, formatNum } from '@/lib/engineering';

export const dynamicParams = false;

const pages = PRODUCTS.filter((p) => p.slug && p.preset);

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug! }));
}

function find(slug: string) {
  return pages.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = find((await params).slug);
  if (!p) return {};
  const title = `${p.name} — sizes & indicative prices | SkyUdaan En-Fab, Bengaluru`;
  return {
    title,
    description: `${p.intro} Sizes from 5 kL to 100 kL with indicative ex-works prices.`,
    alternates: { canonical: `/${p.slug}` },
    openGraph: { title, description: p.intro, images: ['/og.png'] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = find((await params).slug);
  if (!p) notFound();
  const preset = p.preset!;
  const rows = CAPACITY_STOPS.map((cap) => {
    const cfg = { ...defaultConfig, ...preset, capacityLiters: cap };
    return { cap, cfg, r: calculate(cfg) };
  });
  const moc = MOCS.find((m) => m.id === preset.moc)!;
  const ori = ORIENTATIONS.find((o) => o.id === preset.orientation)!;
  const wa = (cap: number) =>
    `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(`RFQ — ${p.name}, ${formatNum(cap)} L (${moc.label}). Please share a firm quote.`)}`;
  const faq = [
    { q: `What sizes of ${p.name.toLowerCase()} do you make?`, a: `Standard sizing runs from 5,000 L to 100,000 L, and SkyUdaan fabricates vessels from 2,000 L up to 500,000 L to your duty.` },
    { q: 'Which design codes do you build to?', a: `${p.code}. All vessels follow ASME, PESO and IS quality plans.` },
    { q: 'How is quality verified?', a: '100% radiography of weld seams per ASME UW-51, hydrostatic testing at 1.5 × MAWP with a 4-hour hold, and material test certificates to EN 10204 3.1. Your QA team or TÜV, DNV, Bureau Veritas or SGS can inspect at every stage.' },
    { q: 'Are the prices on this page final?', a: 'No. They are indicative ex-works budgets from our sizing estimator. A firm, itemised quote follows an engineer’s review of your duty, codes and site.' },
  ];
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SkyUdaan En-Fab', item: 'https://skyudaan-storage-tanks.vercel.app/' },
        { '@type': 'ListItem', position: 2, name: p.name, item: `https://skyudaan-storage-tanks.vercel.app/${p.slug}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div className="pp">
      <header className="pp-nav">
        <a href="/" className="wordmark">
          <span className="wordmark-sky">SkyUdaan</span>
          <span className="wordmark-sub mono">En-Fab · Bengaluru</span>
        </a>
        <a className="btn btn--ink btn--sm" href={`/?c=${encodeConfig({ ...defaultConfig, ...preset })}#configure`}>Configure yours</a>
      </header>

      <main className="pp-main">
        <nav aria-label="Breadcrumb" className="mono pp-crumbs">
          <a href="/">Home</a> / <a href="/#products">Products</a> / <span>{p.name}</span>
        </nav>
        <p className="kicker mono"><span className="kicker-num">{p.group}</span> {p.code}</p>
        <h1 className="display display--md">{p.name}</h1>
        <p className="lede pp-lede">{p.intro}</p>
        <div className="cta-row">
          <a className="btn btn--ink" href={wa(preset.capacityLiters)}>Get a firm quote on WhatsApp</a>
          <a className="btn btn--line" href="/">Watch one being made</a>
        </div>

        <section className="pp-block" aria-labelledby="sizes">
          <h2 id="sizes" className="pp-h2">Sizes & indicative prices</h2>
          <p className="fine">{ori.label} · {moc.label} ({moc.note}). Indicative ex-works budgets; tap a size to quote or configure it.</p>
          <div className="pp-table-wrap">
            <table className="pp-table">
              <thead>
                <tr className="mono">
                  <th>Capacity</th><th>Ø × T/T (mm)</th><th>Shell / head</th><th>Tare (est.)</th><th>Indicative price</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ cap, cfg, r }) => (
                  <tr key={cap}>
                    <td className="pp-cap">{formatNum(cap / 1000)} kL</td>
                    <td>{formatNum(r.diameterMm)} × {formatNum(r.lengthMm)}</td>
                    <td>{r.shellThkMm} / {r.headThkMm} mm</td>
                    <td>~{formatNum(r.emptyWeightKg)} kg</td>
                    <td className="pp-price">{formatInr(r.estPriceInr)}</td>
                    <td className="pp-act">
                      <a className="mono" href={wa(cap)}>Quote</a>
                      <a className="mono" href={`/?c=${encodeConfig(cfg)}#configure`}>Configure</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine">Design code for this duty: {rows[2].r.designCode}. Larger capacities, up to 500 kL, are quoted on request.</p>
        </section>

        <section className="pp-block pp-two" aria-labelledby="included">
          <div>
            <h2 id="included" className="pp-h2">Included with every vessel</h2>
            <ul className="included">{INCLUDED.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h2 className="pp-h2">Questions buyers ask</h2>
            <dl className="pp-faq">
              {faq.map((f) => (
                <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section className="pp-block pp-cta" aria-label="Request a quote">
          <p className="display display--md">Ready to spec <em>yours?</em></p>
          <div className="cta-row">
            <a className="btn btn--ink" href={wa(preset.capacityLiters)}>Quote on WhatsApp</a>
            <a className="btn btn--line" href={COMPANY.phoneHref}>Call {COMPANY.phone}</a>
          </div>
          <p className="fine">{COMPANY.legal} · {COMPANY.address.join(', ')}</p>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div>
  );
}
