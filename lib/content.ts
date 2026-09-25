import type { VesselConfig } from './engineering';

// All copy is carried over from the original SkyUdaan site; nothing here is new claim.

export const COMPANY = {
  name: 'SkyUdaan En-Fab',
  legal: 'Sky Udaan EN-Fab Private Limited',
  phone: '+91 79426 38063',
  phoneHref: 'tel:+917942638063',
  whatsapp: '917942638063',
  ceo: 'Darshan Sulkiya',
  address: ['3rd Floor, No. 33, Chandra Lejas Nilaya', 'Kattigenahalli, Yelahanka', 'Bengaluru 560064, Karnataka'],
  gst: '29ABICS9881M1Z6',
  cin: 'U29299KA2022PTC163914',
  codes: 'ASME Sec VIII · PESO · UL-142 · IS 2825',
};

export type ChapterCopy = {
  kicker: string;
  title: string;
  body: string;
  specs: [string, string][];
  /** What the buyer gets from this operation. */
  gain?: string;
};

export const CHAPTER_COPY: ChapterCopy[] = [
  {
    kicker: 'Heavy containment systems · Bengaluru',
    title: 'Every vessel begins as a flat plate.',
    body: 'Custom pressure vessels, storage tanks and silos, engineered to ASME, PESO and UL codes for Tier-1 EPC contractors. Scroll to watch one being made.',
    specs: [
      ['Capacity', '2,000 L – 500,000 L'],
      ['Codes', 'ASME Sec VIII Div 1 · PESO · UL-142'],
    ],
  },
  {
    kicker: 'Plate rolling',
    title: 'Rolled, not bent into submission.',
    gain: 'A true, round shell that seats its heads cleanly.',
    body: 'Heavy plate rolling machines take boiler-quality plate up to 35 mm thick and roll it into a true cylinder, ready for a joint efficiency of 1.0.',
    specs: [
      ['Max plate rolling', '35 mm'],
      ['Material grades', 'SA 516 Gr. 70 · IS 2062 · SS 316L'],
    ],
  },
  {
    kicker: 'Cold-spun metallurgy',
    title: 'Torispherical & semi-ellipsoidal heads.',
    gain: 'Heads formed without locked-in residual stress.',
    body: 'Hydraulically cold-spun dished ends, formed to eliminate residual hoop stresses, with precision edge bevels for flawless weld-joint geometry.',
    specs: [
      ['Head thickness', '8.0 – 25.0 mm'],
      ['Forming', 'Hydraulic flanging & cold spinning'],
    ],
  },
  {
    kicker: 'Submerged arc welding',
    title: 'One continuous, automated seam.',
    gain: 'Uniform seams with full, consistent penetration.',
    body: 'Longitudinal and circumferential seams are laid by column-and-boom submerged arc welding — deep, consistent penetration and a smooth bead, every time.',
    specs: [
      ['Procedure', 'ASME Sec IX WPS / PQR qualified'],
      ['Process', 'Automatic SAW, column & boom'],
    ],
  },
  {
    kicker: 'Non-destructive examination',
    title: 'Every seam is X-rayed. All of it.',
    gain: 'No weld defect leaves the works unseen.',
    body: 'Full radiographic examination of longitudinal and circumferential welds per ASME UW-51, looking for porosity, slag or lack of fusion.',
    specs: [
      ['Radiography', '100% RT · ASME UW-51'],
      ['Joint efficiency', 'E = 1.0'],
    ],
  },
  {
    kicker: 'Flanging & access',
    title: 'ANSI 150# flanges & a 500 mm manway.',
    gain: 'Full-bore access for inspection, and safe crane erection.',
    body: 'A full-bore inspection manway with forged weld-neck flanges and B7 studs, nozzles reinforced to ASME UG-40, and lifting trunnions for crane erection.',
    specs: [
      ['Manway', 'Ø 500 mm ID with blind flange'],
      ['Flanges', 'ANSI B16.5 Class 150 / 300# RF'],
    ],
  },
  {
    kicker: 'Hydrostatic test',
    title: 'Filled, pressurised, and held.',
    gain: 'Proven at 1.5× pressure before it reaches your site.',
    body: 'Each vessel is filled with treated water and tested at 1.5 × its maximum allowable working pressure on calibrated digital gauges, then held for at least four hours.',
    specs: [
      ['Test pressure', '1.5 × MAWP'],
      ['Hold', '4 hours minimum'],
    ],
  },
  {
    kicker: 'Saddles & coating',
    title: 'Seated on saddles. Sealed in coat.',
    gain: 'Load spread safely into your foundation, finished for your environment.',
    body: 'Saddles with a 120° wrap and full-width wear plates, designed by Zick’s method. Grit-blasted to SA 2.5 near-white metal, then sealed in epoxy or polyurethane.',
    specs: [
      ['Saddle contact', '120° · 8 mm wear plate'],
      ['Surface prep', 'SA 2.5 · 350 µm PU or coal-tar epoxy'],
    ],
  },
  {
    kicker: 'Dispatch',
    title: 'Ready for the plant.',
    body: 'Built strictly to ASME, PESO and IS standards, with material test certificates and stage-wise inspection open to your QA team and third-party inspectors.',
    specs: [],
  },
];

export const NUMBERS = [
  { value: 500, unit: 'kL', label: 'Max tank capacity' },
  { value: 100, unit: '%', label: 'Radiography tested' },
  { value: 35, unit: 'mm', label: 'Max plate rolling' },
  { value: 500, unit: '+', label: 'Systems delivered' },
];

type Preset = Pick<VesselConfig, 'application' | 'orientation' | 'moc' | 'capacityLiters'>;

export const INCLUDED = [
  'Material test certificates (EN 10204 3.1)',
  '100% radiography of weld seams (ASME UW-51)',
  'Hydrostatic test at 1.5 × MAWP, 4-hour hold',
  'SA 2.5 blast and protective coating',
  'General arrangement (GA) drawing',
  'Stage-wise inspection by your QA or TÜV, DNV, BV, SGS',
];

export type Product = { group: string; name: string; code: string; preset?: Preset; slug?: string; intro?: string };

export const PRODUCTS: Product[] = [
  { group: 'Vessels & tanks', name: 'Underground diesel tanks', code: 'PESO · UL-58 · IS 2825', slug: 'underground-diesel-tanks', intro: 'Double-wall underground storage for diesel and HSD, built to PESO, UL-58 and IS 2825. Every seam radiographed, every tank hydro-tested before it leaves Yelahanka.', preset: { application: 'fuel', orientation: 'underground', moc: 'is2062', capacityLiters: 25000 } },
  { group: 'Vessels & tanks', name: 'Aboveground fuel containment', code: 'UL-142 · PESO · API 650', slug: 'aboveground-fuel-tanks', intro: 'Horizontal saddle-mounted fuel tanks to UL-142, PESO and API 650 for plants, DG sets and fuel stations — rolled, SAW-welded and 100% X-rayed in Bengaluru.', preset: { application: 'fuel', orientation: 'horizontal', moc: 'is2062', capacityLiters: 50000 } },
  { group: 'Vessels & tanks', name: 'SS 316 chemical reactors', code: 'ASME Sec VIII Div 1', slug: 'ss316-chemical-reactors', intro: 'Vertical SS 316L process reactors designed to ASME Sec VIII Div 1, for acids, solvents and corrosive duty, with full material traceability (EN 10204 3.1).', preset: { application: 'reactor', orientation: 'vertical', moc: 'ss316', capacityLiters: 10000 } },
  { group: 'Vessels & tanks', name: 'Liquid mixing & agitators', code: 'SS 304 · SS 316L', slug: 'mixing-tanks-agitators', intro: 'Stainless steel mixing and agitator vessels in SS 304 and SS 316L for chemical, pharma and food-grade duty, with inspection manways and ANSI-flanged nozzles.', preset: { application: 'chemical', orientation: 'vertical', moc: 'ss304', capacityLiters: 10000 } },
  { group: 'Vessels & tanks', name: 'Cryogenic liquid oxygen', code: 'Pressure containment' },
  { group: 'Silos & plants', name: 'Cement storage silos', code: '50 T – 250 T', slug: 'cement-storage-silos', intro: 'Vertical cement storage silos from 50 T to 250 T, designed to IS 9178 and DIN 1055, fabricated from heavy rolled plate up to 35 mm.', preset: { application: 'silo', orientation: 'vertical', moc: 'is2062', capacityLiters: 100000 } },
  { group: 'Silos & plants', name: 'Fly ash & lime bolted silos', code: 'IS 9178 · DIN 1055', slug: 'fly-ash-lime-silos', intro: 'Fly ash and lime storage silos to IS 9178 and DIN 1055 for AAC, cement and power plants, blasted to SA 2.5 and coated for outdoor service.', preset: { application: 'silo', orientation: 'vertical', moc: 'is2062', capacityLiters: 75000 } },
  { group: 'Silos & plants', name: 'Turnkey AAC block plants', code: 'Turnkey' },
  { group: 'Silos & plants', name: 'High-pressure autoclaves', code: 'ASME Sec VIII' },
  { group: 'Services', name: 'Heavy plate rolling', code: 'Up to 35 mm' },
];

export const INSPECTORS = ['TÜV', 'DNV', 'Bureau Veritas', 'SGS'];
