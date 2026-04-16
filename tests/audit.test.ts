import { describe, it, expect } from 'vitest';
import { summarize, isAnomalous, type AuditEntry } from '../src/lib/audit';

function entry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    round: 1, probeName: 'test', probeLabel: 'Test',
    billedInput: 100, billedOutput: 50,
    billedCacheCreate: 0, billedCacheRead: 0,
    honestInput: 100, honestOutput: 50,
    billedCost: 0.01, honestCost: 0.01, ratio: 1.0,
    ...overrides,
  };
}

describe('isAnomalous', () => {
  it('normal ratio', () => expect(isAnomalous(1.0)).toBe(false));
  it('slightly high', () => expect(isAnomalous(1.1)).toBe(false));
  it('anomalous high', () => expect(isAnomalous(1.2)).toBe(true));
  it('anomalous low', () => expect(isAnomalous(0.8)).toBe(true));
  it('boundary high', () => expect(isAnomalous(1.15)).toBe(false));
  it('boundary low', () => expect(isAnomalous(0.85)).toBe(false));
});

describe('summarize', () => {
  it('handles empty entries', () => {
    const s = summarize([], 0);
    expect(s.totalBilledCost).toBe(0);
    expect(s.overallRatio).toBe(1);
    expect(s.anomalousRounds).toBe(0);
    expect(s.anomalies).toHaveLength(0);
  });

  it('computes overall ratio', () => {
    const entries = [
      entry({ billedCost: 0.02, honestCost: 0.01, ratio: 2.0 }),
      entry({ round: 2, billedCost: 0.01, honestCost: 0.01, ratio: 1.0 }),
    ];
    const s = summarize(entries, 1000);
    expect(s.totalBilledCost).toBeCloseTo(0.03);
    expect(s.totalHonestCost).toBeCloseTo(0.02);
    expect(s.overallRatio).toBeCloseTo(1.5);
  });

  it('counts anomalous rounds', () => {
    const entries = [
      entry({ ratio: 1.0 }),
      entry({ round: 2, ratio: 1.5 }),
      entry({ round: 3, ratio: 0.5 }),
    ];
    const s = summarize(entries, 0);
    expect(s.anomalousRounds).toBe(2);
  });

  it('computes cache hit rate', () => {
    const entries = [
      entry({ billedInput: 10, billedCacheRead: 90, billedCacheCreate: 0 }),
    ];
    const s = summarize(entries, 0);
    expect(s.cacheHitRate).toBeCloseTo(0.9);
  });

  it('computes tokens per second', () => {
    const entries = [entry({ billedOutput: 100 })];
    const s = summarize(entries, 2000);
    expect(s.tokensPerSecond).toBeCloseTo(50);
  });
});

describe('anomaly detection', () => {
  it('detects token inflation', () => {
    const entries = [entry({ billedInput: 200, honestInput: 100 })];
    const s = summarize(entries, 0);
    const inflations = s.anomalies.filter((a) => a.type === 'token_inflation');
    expect(inflations.length).toBeGreaterThan(0);
    expect(inflations[0].round).toBe(1);
  });

  it('detects cost_mismatch for high ratio', () => {
    const entries = [entry({ ratio: 2.0 })];
    const s = summarize(entries, 0);
    const mismatches = s.anomalies.filter((a) => a.type === 'cost_mismatch');
    expect(mismatches.length).toBeGreaterThan(0);
    expect(mismatches.some((a) => a.severity === 'critical')).toBe(true);
  });

  it('detects missing_usage', () => {
    const entries = [entry({ billedInput: 0, billedOutput: 0 })];
    const s = summarize(entries, 0);
    expect(s.anomalies.some((a) => a.type === 'missing_usage')).toBe(true);
  });

  it('detects cache_anomaly when creation but no reads', () => {
    const entries = [
      entry({ billedCacheCreate: 500, billedCacheRead: 0 }),
      entry({ round: 2, billedCacheCreate: 500, billedCacheRead: 0 }),
      entry({ round: 3, billedCacheCreate: 500, billedCacheRead: 0 }),
    ];
    const s = summarize(entries, 0);
    expect(s.anomalies.some((a) => a.type === 'cache_anomaly')).toBe(true);
  });

  it('detects token_deflation', () => {
    const entries = [entry({ billedInput: 50, honestInput: 100 })];
    const s = summarize(entries, 0);
    expect(s.anomalies.some((a) => a.type === 'token_deflation')).toBe(true);
  });

  it('no anomalies for clean data', () => {
    const entries = [entry(), entry({ round: 2 })];
    const s = summarize(entries, 0);
    expect(s.anomalies).toHaveLength(0);
  });

  it('anomalies have severity field', () => {
    const entries = [entry({ ratio: 2.0 })];
    const s = summarize(entries, 0);
    for (const a of s.anomalies) {
      expect(['info', 'warning', 'critical']).toContain(a.severity);
    }
  });
});
