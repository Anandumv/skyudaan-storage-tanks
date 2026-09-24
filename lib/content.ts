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
    body: 'Heavy plate rolling machines take boiler-quality plate up to 35 mm thick and roll it into a true cylinder, ready for a joint efficiency of 1.0.',
    specs: [
      ['Max plate rolling', '35 mm'],
      ['Material grades', 'SA 516 Gr. 70 · IS 2062 · SS 316L'],
    ],
  },
  {
    kicker: 'Cold-spun metallurgy',
    title: 'Torispherical & semi-ellipsoidal heads.',
    body: 'Hydraulically cold-spun dished ends, formed to eliminate residual hoop stresses, with precision edge bevels for flawless weld-joint geometry.',
    specs: [
      ['Head thickness', '8.0 – 25.0 mm'],
      ['Forming', 'Hydraulic flanging & cold spinning'],
    ],
  },
  {
    kicker: 'Submerged arc welding',
    title: 'One continuous, automated seam.',
    body: 'Longitudinal and circumferential seams are laid by column-and-boom submerged arc welding — deep, consistent penetration and a smooth bead, every time.',
    specs: [
      ['Procedure', 'ASME Sec IX WPS / PQR qualified'],
      ['Process', 'Automatic SAW, column & boom'],
    ],
  },
  {
    kicker: 'Non-destructive examination',
    title: 'Every seam is X-rayed. All of it.',
    body: 'Full radiographic examination of longitudinal and circumferential welds per ASME UW-51, looking for porosity, slag or lack of fusion.',
    specs: [
      ['Radiography', '100% RT · ASME UW-51'],
      ['Joint efficiency', 'E = 1.0'],
    ],
  },
  {
    kicker: 'Flanging & access',
    title: 'ANSI 150# flanges & a 500 mm manway.',
    body: 'A full-bore inspection manway with forged weld-neck flanges and B7 studs, nozzles reinforced to ASME UG-40, and lifting trunnions for crane erection.',
    specs: [
      ['Manway', 'Ø 500 mm ID with blind flange'],
      ['Flanges', 'ANSI B16.5 Class 150 / 300# RF'],
    ],
  },
  {
    kicker: 'Hydrostatic test',
    title: 'Filled, pressurised, and held.',
    body: 'Each vessel is filled with treated water and tested at 1.5 × its maximum allowable working pressure on calibrated digital gauges, then held for at least four hours.',
    specs: [
      ['Test pressure', '1.5 × MAWP'],
      ['Hold', '4 hours minimum'],
    ],
  },
  {
    kicker: 'Saddles & coating',
    title: 'Seated on saddles. Sealed in coat.',
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

export const PRODUCTS = [
  { group: 'Vessels & tanks', name: 'Underground diesel tanks', code: 'PESO · UL-58 · IS 2825' },
  { group: 'Vessels & tanks', name: 'Aboveground fuel containment', code: 'UL-142 · PESO · API 650' },
  { group: 'Vessels & tanks', name: 'SS 316 chemical reactors', code: 'ASME Sec VIII Div 1' },
  { group: 'Vessels & tanks', name: 'Liquid mixing & agitators', code: 'SS 304 · SS 316L' },
  { group: 'Vessels & tanks', name: 'Cryogenic liquid oxygen', code: 'Pressure containment' },
  { group: 'Silos & plants', name: 'Cement storage silos', code: '50 T – 250 T' },
  { group: 'Silos & plants', name: 'Fly ash & lime bolted silos', code: 'IS 9178 · DIN 1055' },
  { group: 'Silos & plants', name: 'Turnkey AAC block plants', code: 'Turnkey' },
  { group: 'Silos & plants', name: 'High-pressure autoclaves', code: 'ASME Sec VIII' },
  { group: 'Services', name: 'Heavy plate rolling', code: 'Up to 35 mm' },
];

export const INSPECTORS = ['TÜV', 'DNV', 'Bureau Veritas', 'SGS'];
