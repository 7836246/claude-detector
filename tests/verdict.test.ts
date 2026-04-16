import { describe, it, expect } from 'vitest';
import { determineVerdict } from '../src/lib/verdict';
import type { ProbeResult } from '../src/lib/probes';
import type { AuditSummary } from '../src/lib/audit';

function probe(name: string, passed: boolean, category = 'structural'): ProbeResult {
  return {
    name, label: name, category: category as any,
    weight: 2, passed, score: passed ? 1 : 0, detail: '',
  };
}

const emptyAudit: AuditSummary = {
  entries: [], anomalies: [],
  totalBilledCost: 0, totalHonestCost: 0, overallRatio: 1,
  cacheHitRate: 0, totalInputTokens: 0, totalOutputTokens: 0,
  totalLatencyMs: 0, tokensPerSecond: 0, anomalousRounds: 0,
};

function auditWith(ratio: number): AuditSummary {
  return {
    ...emptyAudit,
    entries: [{
      round: 1, probeName: 'x', probeLabel: 'x',
      billedInput: 100, billedOutput: 50,
      billedCacheCreate: 0, billedCacheRead: 0,
      honestInput: 100, honestOutput: 50,
      billedCost: ratio * 0.01, honestCost: 0.01, ratio,
    }],
    totalBilledCost: ratio * 0.01,
    totalHonestCost: 0.01,
    overallRatio: ratio,
  };
}

function allPassingProbes(): ProbeResult[] {
  return [
    probe('connectivity', true, 'structural'),
    probe('model_echo', true, 'signature'),
    probe('response_shape', true, 'structural'),
    probe('count_tokens_match', true, 'token_audit'),
    probe('system_adherence', true, 'behavior'),
    probe('stop_sequence', true, 'behavior'),
    probe('max_tokens', true, 'behavior'),
    probe('tool_use', true, 'behavior'),
    probe('multi_turn', true, 'behavior'),
    probe('streaming_shape', true, 'structural'),
    probe('error_shape', true, 'signature_authenticity'),
    probe('self_identification', true, 'llm_fingerprint'),
    probe('reasoning_fingerprint', true, 'llm_fingerprint'),
    probe('multimodal', true, 'multimodal'),
    probe('document_input', true, 'multimodal'),
    probe('cache_behavior', true, 'structural'),
    probe('system_prompt_leak', true, 'signature_authenticity'),
    probe('consistency_check', true, 'signature_authenticity'),
    probe('header_fingerprint', true, 'signature'),
  ];
}

describe('determineVerdict', () => {
  it('returns inconclusive when connectivity fails', () => {
    const results = allPassingProbes();
    results[0] = probe('connectivity', false);
    const v = determineVerdict(results, emptyAudit);
    expect(v.result).toBe('inconclusive');
    expect(v.channel).toBeNull();
  });

  it('returns counterfeit when model_echo + self_id both fail', () => {
    const results = allPassingProbes();
    results[1] = probe('model_echo', false, 'signature');
    results[11] = probe('self_identification', false, 'llm_fingerprint');
    const v = determineVerdict(results, emptyAudit);
    expect(v.result).toBe('counterfeit');
  });

  it('returns suspicious+reverse-proxy when tool_use + streaming + cache fail', () => {
    const results = allPassingProbes();
    for (const name of ['tool_use', 'streaming_shape', 'cache_behavior']) {
      const p = results.find(r => r.name === name)!;
      p.passed = false; p.score = 0;
    }
    const v = determineVerdict(results, emptyAudit);
    expect(v.result).toBe('suspicious');
    expect(v.channel).toBe('reverse-proxy');
  });

  it('returns authentic+anthropic when all pass + ratio ≤ 1.05 + headers', () => {
    const results = allPassingProbes();
    const v = determineVerdict(results, auditWith(1.02));
    expect(v.result).toBe('authentic');
    expect(v.channel).toBe('anthropic');
    expect(v.confidence).toBeGreaterThanOrEqual(90);
  });

  it('returns authentic+subscription when all pass + ratio ≤ 1.15 + no headers', () => {
    const results = allPassingProbes();
    results.find(r => r.name === 'header_fingerprint')!.passed = false;
    const v = determineVerdict(results, auditWith(1.10));
    expect(v.result).toBe('authentic');
    expect(v.channel).toBe('subscription');
  });

  it('returns authentic_degraded when all pass but ratio > 1.15', () => {
    const results = allPassingProbes();
    const v = determineVerdict(results, auditWith(1.5));
    expect(v.result).toBe('authentic_degraded');
  });

  it('detects hidden prompt injection → authentic_degraded', () => {
    const results = allPassingProbes();
    results.find(r => r.name === 'system_prompt_leak')!.passed = false;
    const v = determineVerdict(results, auditWith(1.02));
    expect(v.result).toBe('authentic_degraded');
    expect(v.signals.some(s => s.includes('注入'))).toBe(true);
  });

  it('returns third_party for high ratio with most passing', () => {
    const results = allPassingProbes();
    // Fail a few non-critical ones
    results.find(r => r.name === 'header_fingerprint')!.passed = false;
    results.find(r => r.name === 'cache_behavior')!.passed = false;
    const v = determineVerdict(results, auditWith(1.3));
    expect(v.result).toBe('third_party');
    expect(v.channel).toBe('proxy');
  });

  it('has market price for every verdict', () => {
    const v = determineVerdict(allPassingProbes(), auditWith(1.0));
    expect(v.marketPrice).toBeTruthy();
  });

  it('separates result and channel', () => {
    const v = determineVerdict(allPassingProbes(), auditWith(1.0));
    expect(v).toHaveProperty('result');
    expect(v).toHaveProperty('channel');
    expect(v.result).not.toBe(v.channel);
  });

  it('always has label, description, signals', () => {
    const v = determineVerdict(allPassingProbes(), auditWith(1.0));
    expect(v.label).toBeTruthy();
    expect(v.description).toBeTruthy();
    expect(v.signals).toBeInstanceOf(Array);
  });
});
