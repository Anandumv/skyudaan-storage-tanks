// One scalar clock drives the whole film. Chapter i owns t ∈ [i, i + 1].

export const CHAPTERS = [
  { id: 'plate', label: 'Plate' },
  { id: 'rolling', label: 'Rolling' },
  { id: 'heads', label: 'Dished heads' },
  { id: 'weld', label: 'SAW weld' },
  { id: 'xray', label: 'Radiography' },
  { id: 'nozzles', label: 'Nozzles' },
  { id: 'hydro', label: 'Hydrotest' },
  { id: 'finish', label: 'Saddles & coat' },
  { id: 'dispatch', label: 'Dispatch' },
] as const;

export const FILM_END = CHAPTERS.length;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Linear 0→1 progress of t across [a, b]. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const smooth = (x: number) => x * x * (3 - 2 * x);

export const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
