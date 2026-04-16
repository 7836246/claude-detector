import { describe, it, expect } from 'vitest';
import {
  PROBES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  aggregate,
  summarizeCategories,
  type ProbeResult,
} from '../src/lib/probes';

describe('PROBES', () => {
  it('has 19 probes', () => {
    expect(PROBES).toHaveLength(19);
  });

  it('each has required fields', () => {
    for (const p of PROBES) {
      expect(p.name).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(typeof p.weight).toBe('number');
      expect(typeof p.run).toBe('function');
    }
  });

  it('has unique names', () => {
    const names = PROBES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all categories have labels', () => {
    for (const p of PROBES) {
      expect(CATEGORY_LABELS[p.category]).toBeTruthy();
    }
  });

  it('only count_tokens_match is auditOnly', () => {
    const auditOnly = PROBES.filter((p) => p.auditOnly);
    expect(auditOnly).toHaveLength(1);
    expect(auditOnly[0].name).toBe('count_tokens_match');
  });
});

describe('CATEGORY_ORDER', () => {
  it('has 7 categories', () => {
    expect(CATEGORY_ORDER).toHaveLength(7);
  });

  it('all categories are unique', () => {
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
  });
});

describe('aggregate', () => {
  function pr(passed: boolean, weight = 1): ProbeResult {
    return {
      name: 'x', label: 'x', category: 'structural' as any,
      weight, passed, score: passed ? 1 : 0, detail: '',
    };
  }

  it('returns 100 for all passing', () => {
    const { score, verdict } = aggregate([pr(true), pr(true)]);
    expect(score).toBe(100);
    expect(verdict).toBe('genuine');
  });

  it('returns 0 for all failing', () => {
    const { score, verdict } = aggregate([pr(false), pr(false)]);
    expect(score).toBe(0);
    expect(verdict).toBe('fake');
  });

  it('respects weights', () => {
    const { score } = aggregate([pr(true, 3), pr(false, 1)]);
    // 3 * 1 / (3 + 1) = 0.75 → 75
    expect(score).toBe(75);
  });

  it('suspicious in the middle', () => {
    const results = [pr(true, 1), pr(true, 1), pr(false, 1), pr(false, 1)];
    const { verdict } = aggregate(results);
    expect(verdict).toBe('suspicious');
  });
});

describe('summarizeCategories', () => {
  it('groups by category', () => {
    const results: ProbeResult[] = [
      { name: 'a', label: 'A', category: 'structural' as any, weight: 1, passed: true, score: 1, detail: '' },
      { name: 'b', label: 'B', category: 'structural' as any, weight: 1, passed: false, score: 0, detail: '' },
      { name: 'c', label: 'C', category: 'behavior' as any, weight: 1, passed: true, score: 1, detail: '' },
    ];
    const cats = summarizeCategories(results);
    const structural = cats.find((c) => c.category === 'structural');
    const behavior = cats.find((c) => c.category === 'behavior');
    expect(structural?.passed).toBe(false); // one failed
    expect(behavior?.passed).toBe(true);
  });
});
