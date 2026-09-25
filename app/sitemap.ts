import type { MetadataRoute } from 'next';
import { PRODUCTS } from '@/lib/content';

export const dynamic = 'force-static';
const BASE = 'https://skyudaan-storage-tanks.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'monthly', priority: 1 },
    ...PRODUCTS.filter((p) => p.slug).map((p) => ({ url: `${BASE}/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
