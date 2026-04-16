import { describe, it, expect } from 'vitest';
import { getPricing, computeCost } from '../src/lib/pricing';

describe('getPricing', () => {
  it('returns exact match', () => {
    const p = getPricing('claude-opus-4-6');
    expect(p.input).toBe(15);
    expect(p.output).toBe(75);
  });

  it('strips date suffix', () => {
    const p = getPricing('claude-sonnet-4-6-20260101');
    expect(p.input).toBe(3);
  });

  it('falls back to opus for unknown model', () => {
    const p = getPricing('claude-unknown-99');
    expect(p.input).toBe(15);
  });
});

describe('computeCost', () => {
  it('calculates basic cost', () => {
    const p = getPricing('claude-opus-4-6');
    const cost = computeCost(p, { input: 1000, output: 500 });
    // 1000 * 15 / 1M + 500 * 75 / 1M = 0.015 + 0.0375 = 0.0525
    expect(cost).toBeCloseTo(0.0525, 6);
  });

  it('includes cache costs', () => {
    const p = getPricing('claude-opus-4-6');
    const cost = computeCost(p, { input: 0, output: 0, cacheWrite: 1000, cacheRead: 1000 });
    // 1000 * 18.75 / 1M + 1000 * 1.5 / 1M = 0.01875 + 0.0015 = 0.02025
    expect(cost).toBeCloseTo(0.02025, 6);
  });

  it('returns 0 for zero usage', () => {
    const p = getPricing('claude-opus-4-6');
    expect(computeCost(p, { input: 0, output: 0 })).toBe(0);
  });
});
