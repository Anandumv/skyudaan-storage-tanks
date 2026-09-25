// Engineering estimator ported verbatim from the legacy configurator (js/configurator.js).
// Numbers are indicative sizing for an RFQ conversation, not a design calculation.

export type Application = 'fuel' | 'chemical' | 'silo' | 'reactor' | 'dairy';
export type Orientation = 'horizontal' | 'vertical' | 'underground';
export type Moc = 'is2062' | 'ss304' | 'ss316' | 'sa516';

export interface Accessories {
  manhole: boolean;
  baffles: boolean;
  ladder: boolean;
  flameArrestor: boolean;
  heatingJacket: boolean;
}

export interface VesselConfig {
  application: Application;
  orientation: Orientation;
  capacityLiters: number;
  moc: Moc;
  accessories: Accessories;
}

export interface VesselCalc {
  diameterMm: number;
  lengthMm: number;
  shellThkMm: number;
  headThkMm: number;
  emptyWeightKg: number;
  estPriceInr: number;
  designCode: string;
}

export const defaultConfig: VesselConfig = {
  application: 'fuel',
  orientation: 'horizontal',
  capacityLiters: 25000,
  moc: 'is2062',
  accessories: { manhole: true, baffles: true, ladder: false, flameArrestor: false, heatingJacket: false },
};

export const APPLICATIONS: { id: Application; label: string }[] = [
  { id: 'fuel', label: 'Diesel & Fuel' },
  { id: 'chemical', label: 'Chemicals / Acid' },
  { id: 'silo', label: 'Cement / Fly Ash Silo' },
  { id: 'reactor', label: 'Process Reactor' },
  { id: 'dairy', label: 'Dairy & Food Grade' },
];

export const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: 'horizontal', label: 'Horizontal saddle' },
  { id: 'vertical', label: 'Vertical skirt / legs' },
  { id: 'underground', label: 'Underground double-wall' },
];

export const MOCS: { id: Moc; label: string; note: string }[] = [
  { id: 'is2062', label: 'IS 2062 Gr. B', note: 'Carbon steel' },
  { id: 'ss304', label: 'SS 304', note: 'Food grade' },
  { id: 'ss316', label: 'SS 316L', note: 'Acid resistant' },
  { id: 'sa516', label: 'SA 516 Gr. 70', note: 'Boiler quality' },
];

export const ACCESSORIES: { id: keyof Accessories; label: string }[] = [
  { id: 'manhole', label: '500 mm manway + blind flange' },
  { id: 'baffles', label: 'Internal anti-surge baffles' },
  { id: 'ladder', label: 'Caged ladder & catwalk' },
  { id: 'flameArrestor', label: 'PESO flame arrestor' },
];

export const CAPACITY_STOPS = [5000, 10000, 25000, 50000, 75000, 100000];

export function isHorizontal(o: Orientation) {
  return o === 'horizontal' || o === 'underground';
}

export function calculate(c: VesselConfig): VesselCalc {
  const V = c.capacityLiters / 1000;
  let diameterM: number, lengthM: number, shellThkMm: number, headThkMm: number, designCode: string;

  if (isHorizontal(c.orientation)) {
    const ld = 3.0;
    diameterM = Math.pow(V / ((Math.PI * ld) / 4), 1 / 3);
    lengthM = diameterM * ld;
    if (c.capacityLiters <= 10000) [shellThkMm, headThkMm] = [6, 8];
    else if (c.capacityLiters <= 50000) [shellThkMm, headThkMm] = [8, 10];
    else [shellThkMm, headThkMm] = [10, 12];
    designCode =
      c.application === 'fuel'
        ? c.orientation === 'underground' ? 'PESO / UL-58 / IS 2825' : 'UL-142 / PESO / API 650'
        : 'ASME Sec VIII Div 1';
  } else {
    const ld = c.application === 'silo' ? 3.5 : 2.0;
    diameterM = Math.pow(V / ((Math.PI * ld) / 4), 1 / 3);
    lengthM = diameterM * ld;
    shellThkMm = c.application === 'silo' ? 6 : 8;
    headThkMm = 10;
    designCode = c.application === 'silo' ? 'IS 9178 / DIN 1055' : 'ASME Sec VIII Div 1 / IS 2825';
  }

  const area = Math.PI * diameterM * lengthM + 2 * (1.15 * Math.PI * Math.pow(diameterM / 2, 2));
  const density = c.moc === 'ss304' || c.moc === 'ss316' ? 8000 : 7850;
  const avgThkM = (shellThkMm + headThkMm) / 2 / 1000;
  const emptyWeightKg = Math.round(area * avgThkM * density * 1.25);

  const rate = { is2062: 120, ss304: 310, ss316: 440, sa516: 180 }[c.moc];
  let cost = emptyWeightKg * rate;
  if (c.application === 'reactor' || c.accessories.heatingJacket) cost *= 1.35;
  if (c.accessories.flameArrestor) cost += 28000;
  if (c.accessories.ladder) cost += 35000;

  return {
    diameterMm: Math.round(diameterM * 1000),
    lengthMm: Math.round(lengthM * 1000),
    shellThkMm,
    headThkMm,
    emptyWeightKg,
    estPriceInr: Math.round(cost / 1000) * 1000,
    designCode,
  };
}

export function formatInr(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export function formatNum(n: number) {
  return n.toLocaleString('en-IN');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Standalone 1:50 GA drawing, light editorial style, for download. */
export function gaDrawingSvg(c: VesselConfig, date = new Date().toISOString().slice(0, 10)): string {
  const r = calculate(c);
  const W = 1200, H = 800;
  const horiz = isHorizontal(c.orientation);
  const ink = '#0d0e10', cobalt = '#1d3bff', hair = '#c9c6bd';
  // Fit the vessel into a 760 x 420 drawing field.
  const maxLen = horiz ? 600 : 420, maxDia = horiz ? 300 : 360;
  const s = Math.min(maxLen / (r.lengthMm * 1.2), maxDia / r.diameterMm);
  const L = r.lengthMm * s, D = r.diameterMm * s, head = D * 0.25;
  const cx = horiz ? 500 : 470, cy = 380;
  let body = '';
  if (horiz) {
    const x1 = cx - L / 2, x2 = cx + L / 2, y1 = cy - D / 2, y2 = cy + D / 2;
    body += `<path d="M${x1} ${y1} H${x2} Q${x2 + head * 1.33} ${cy} ${x2} ${y2} H${x1} Q${x1 - head * 1.33} ${cy} ${x1} ${y1} Z" fill="none" stroke="${ink}" stroke-width="1.6"/>`;
    body += `<line x1="${x1 - head - 20}" y1="${cy}" x2="${x2 + head + 20}" y2="${cy}" stroke="${ink}" stroke-dasharray="14 4 3 4" stroke-width=".6"/>`;
    for (const sx of [x1 + L * 0.2, x2 - L * 0.2]) body += `<path d="M${sx - 26} ${y2 + 34} h52 l-10 -34 h-32 z" fill="none" stroke="${ink}" stroke-width="1.2"/>`;
    if (c.accessories.manhole) body += `<rect x="${cx - 14}" y="${y1 - 22}" width="28" height="22" fill="none" stroke="${ink}" stroke-width="1.2"/><line x1="${cx - 20}" y1="${y1 - 22}" x2="${cx + 20}" y2="${y1 - 22}" stroke="${ink}" stroke-width="2"/>`;
    body += `<line x1="${x1}" y1="${y1 - 60}" x2="${x2}" y2="${y1 - 60}" stroke="${cobalt}"/><text x="${cx}" y="${y1 - 68}" class="d">T/T ${r.lengthMm} mm</text>`;
    body += `<line x1="${x1 - head - 40}" y1="${y1}" x2="${x1 - head - 40}" y2="${y2}" stroke="${cobalt}"/><text x="${x1 - head - 40}" y="${y1 - 12}" class="d">Ø ${r.diameterMm} mm ID</text>`;
  } else {
    const x1 = cx - D / 2, x2 = cx + D / 2, y1 = cy - L / 2, y2 = cy + L / 2;
    body += `<path d="M${x1} ${y2} V${y1} Q${cx} ${y1 - head * 1.6} ${x2} ${y1} V${y2} Q${cx} ${y2 + head * 1.6} ${x1} ${y2} Z" fill="none" stroke="${ink}" stroke-width="1.6"/>`;
    body += `<line x1="${cx}" y1="${y1 - head - 20}" x2="${cx}" y2="${y2 + head + 20}" stroke="${ink}" stroke-dasharray="14 4 3 4" stroke-width=".6"/>`;
    body += `<path d="M${x1 + 6} ${y2 + head * 0.7} L${x1 - 10} ${y2 + head + 60} M${x2 - 6} ${y2 + head * 0.7} L${x2 + 10} ${y2 + head + 60}" stroke="${ink}" stroke-width="1.4"/>`;
    body += `<line x1="${x2 + 50}" y1="${y1}" x2="${x2 + 50}" y2="${y2}" stroke="${cobalt}"/><text x="${x2 + 60}" y="${cy}" class="d" text-anchor="start">T/T ${r.lengthMm} mm</text>`;
    body += `<line x1="${x1}" y1="${y1 - head - 40}" x2="${x2}" y2="${y1 - head - 40}" stroke="${cobalt}"/><text x="${cx}" y="${y1 - head - 48}" class="d">Ø ${r.diameterMm} mm ID</text>`;
  }
  const rows: [string, string][] = [
    ['CAPACITY', `${formatNum(c.capacityLiters)} L`],
    ['ORIENTATION', c.orientation.toUpperCase()],
    ['MOC', MOCS.find((m) => m.id === c.moc)!.label],
    ['SHELL / HEAD', `${r.shellThkMm} / ${r.headThkMm} mm`],
    ['TARE (EST.)', `${formatNum(r.emptyWeightKg)} kg`],
    ['DESIGN CODE', r.designCode],
    ['WELDING', 'SAW · 100% RT (UW-51)'],
    ['HYDROTEST', '1.5 × MAWP · 4 h hold'],
    ['DATE', date],
  ];
  const tb = rows
    .map(([k, v], i) => `<text x="${W - 330}" y="${150 + i * 34}" class="k">${k}</text><text x="${W - 60}" y="${150 + i * 34}" class="v">${esc(v)}</text><line x1="${W - 330}" y1="${160 + i * 34}" x2="${W - 60}" y2="${160 + i * 34}" stroke="${hair}"/>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>text{font-family:ui-monospace,Menlo,monospace;fill:${ink}}.d{font-size:13px;fill:${cobalt};text-anchor:middle}.k{font-size:11px;letter-spacing:.08em;fill:#6b6960}.v{font-size:12px;text-anchor:end}</style>
<rect width="${W}" height="${H}" fill="#f3f2ee"/>
<rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${ink}" stroke-width="1.5"/>
${body}
<text x="${W - 330}" y="100" style="font-size:18px;font-weight:700">SKYUDAAN EN-FAB</text>
<text x="${W - 330}" y="120" class="k">GENERAL ARRANGEMENT · 1:50 · INDICATIVE</text>
${tb}
<text x="48" y="${H - 44}" class="k">YELAHANKA, BENGALURU · INDICATIVE SIZING FOR RFQ — NOT FOR CONSTRUCTION</text>
</svg>`;
}

/** Short, readable code for a configuration, e.g. SU-H25-IS. Not a catalogue number. */
export function configCode(c: VesselConfig) {
  const o = { horizontal: 'H', vertical: 'V', underground: 'U' }[c.orientation];
  const m = { is2062: 'IS', ss304: 'S4', ss316: 'S6', sa516: 'SA' }[c.moc];
  return `SU-${o}${Math.round(c.capacityLiters / 1000)}-${m}`;
}

/** URL-safe share token, e.g. fuel.horizontal.25000.is2062 */
export function encodeConfig(c: VesselConfig) {
  return [c.application, c.orientation, c.capacityLiters, c.moc].join('.');
}

export function decodeConfig(token: string | null): Partial<VesselConfig> | null {
  if (!token) return null;
  const [a, o, cap, m] = token.split('.');
  const app = APPLICATIONS.find((x) => x.id === a)?.id;
  const ori = ORIENTATIONS.find((x) => x.id === o)?.id;
  const moc = MOCS.find((x) => x.id === m)?.id;
  const n = Number(cap);
  if (!app || !ori || !moc || !Number.isFinite(n)) return null;
  return { application: app, orientation: ori, moc, capacityLiters: Math.min(100000, Math.max(5000, Math.round(n / 5000) * 5000)) };
}
