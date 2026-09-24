import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const title = 'SkyUdaan En-Fab — Pressure vessels & storage tanks, Bengaluru';
const description =
  'Watch a pressure vessel being made, from flat plate to finished tank, then spec your own. ASME Sec VIII, PESO and UL-142 vessels, tanks and silos from Yelahanka, Bengaluru.';

export const metadata: Metadata = {
  metadataBase: new URL('https://skyudaan-storage-tanks.vercel.app'),
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: { title, description, type: 'website', locale: 'en_IN', siteName: 'SkyUdaan En-Fab', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Every vessel begins as a flat plate.' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#f3f2ee', width: 'device-width', initialScale: 1 };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Sky Udaan EN-Fab Private Limited',
  alternateName: 'SkyUdaan En-Fab',
  url: 'https://skyudaan-storage-tanks.vercel.app',
  telephone: '+91-7942638063',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '3rd Floor, No. 33, Chandra Lejas Nilaya, Kattigenahalli, Yelahanka',
    addressLocality: 'Bengaluru',
    postalCode: '560064',
    addressRegion: 'Karnataka',
    addressCountry: 'IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
