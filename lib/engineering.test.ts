import { describe, expect, it } from 'vitest';
import { calculate, defaultConfig, formatInr, gaDrawingSvg } from './engineering';

// Oracle values produced by the original js/configurator.js (commit ca0cd3a).
describe('calculate', () => {
  it('matches the legacy 25 kL horizontal diesel tank', () => {
    expect(calculate(defaultConfig)).toEqual({
      diameterMm: 2197,
      lengthMm: 6592,
      shellThkMm: 8,
      headThkMm: 10,
      emptyWeightKg: 4789,
      estPriceInr: 575000,
      designCode: 'UL-142 / PESO / API 650',
    });
  });

  it('matches the legacy 100 kL SS316 silo with ladder and flame arrestor', () => {
    const r = calculate({
      ...defaultConfig,
      application: 'silo',
      orientation: 'vertical',
      capacityLiters: 100000,
      moc: 'ss316',
      accessories: { ...defaultConfig.accessories, ladder: true, flameArrestor: true },
    });
    expect(r).toMatchObject({ diameterMm: 3313, lengthMm: 11597, emptyWeightKg: 11244, estPriceInr: 5010000, designCode: 'IS 9178 / DIN 1055' });
  });

  it('matches the legacy 5 kL SA516 vertical reactor', () => {
    const r = calculate({ ...defaultConfig, application: 'reactor', orientation: 'vertical', capacityLiters: 5000, moc: 'sa516' });
    expect(r).toMatchObject({ diameterMm: 1471, lengthMm: 2942, emptyWeightKg: 1546, estPriceInr: 376000 });
  });

  it('uses the underground fuel code', () => {
    expect(calculate({ ...defaultConfig, orientation: 'underground' }).designCode).toBe('PESO / UL-58 / IS 2825');
  });
});

describe('formatInr', () => {
  it('uses Indian digit grouping', () => {
    expect(formatInr(575000)).toBe('₹5,75,000');
    expect(formatInr(5010000)).toBe('₹50,10,000');
  });
});

describe('gaDrawingSvg', () => {
  it('is a standalone SVG carrying the computed dimensions', () => {
    const svg = gaDrawingSvg(defaultConfig);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain('Ø 2197');
    expect(svg).toContain('6592');
    expect(svg).toContain('SKYUDAAN EN-FAB');
  });
});
