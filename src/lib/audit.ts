// Token usage audit — inspired by LDS-API protocol.
// Compare platform-reported usage against independent count_tokens recount.
// Classify anomalies by type and severity.

// --- Anomaly classification (LDS-compatible) ---

export type AnomalyType =
  | 'token_inflation'   // Billed tokens > honest recount
  | 'token_deflation'   // Billed tokens < honest recount (unusual but possible)
  | 'cache_anomaly'     // Unexpected cache behavior (creation without cache_control, etc.)
  | 'cost_mismatch'     // billedCost / honestCost ratio out of range
  | 'missing_usage'     // usage fields absent or zero when they shouldn't be
  | 'other';

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  round: number | null; // null = overall anomaly
}

// --- Audit entry (per-round) ---

export interface AuditEntry {
  round: number;
  probeName: string;
  probeLabel: string;

  billedInput: number;
  billedOutput: number;
  billedCacheCreate: number;
  billedCacheRead: number;

  honestInput: number | null;
  honestOutput: number | null;

  billedCost: number;
  honestCost: number;
  ratio: number;
}

// --- Audit summary ---

export interface AuditSummary {
  entries: AuditEntry[];
  anomalies: Anomaly[];

  totalBilledCost: number;
  totalHonestCost: number;
  overallRatio: number;

  cacheHitRate: number;

  totalInputTokens: number;
  totalOutputTokens: number;

  totalLatencyMs: number;
  tokensPerSecond: number;

  anomalousRounds: number;
}

// --- Thresholds ---

const TOLERANCE_LOW = 0.85;
const TOLERANCE_HIGH = 1.15;
const CRITICAL_HIGH = 1.50;

export function isAnomalous(ratio: number): boolean {
  return ratio > TOLERANCE_HIGH || ratio < TOLERANCE_LOW;
}

// --- Anomaly detection per entry ---

function detectEntryAnomalies(e: AuditEntry): Anomaly[] {
  const out: Anomaly[] = [];

  if (e.honestInput !== null && e.billedInput > e.honestInput * 1.15) {
    const pct = Math.round(((e.billedInput - e.honestInput) / e.honestInput) * 100);
    out.push({
      type: 'token_inflation',
      severity: pct > 50 ? 'critical' : 'warning',
      messageKey: 'anomaly.input_inflated',
      messageParams: { round: e.round, pct, billed: e.billedInput, honest: e.honestInput },
      round: e.round,
    });
  }

  if (e.honestOutput !== null && e.billedOutput > e.honestOutput * 1.15 && e.billedOutput > 5) {
    const pct = Math.round(((e.billedOutput - e.honestOutput) / e.honestOutput) * 100);
    out.push({
      type: 'token_inflation',
      severity: pct > 50 ? 'critical' : 'warning',
      messageKey: 'anomaly.output_inflated',
      messageParams: { round: e.round, pct, billed: e.billedOutput, honest: e.honestOutput },
      round: e.round,
    });
  }

  if (e.honestInput !== null && e.billedInput < e.honestInput * TOLERANCE_LOW && e.honestInput > 10) {
    out.push({
      type: 'token_deflation',
      severity: 'info',
      messageKey: 'anomaly.input_deflated',
      messageParams: { round: e.round, billed: e.billedInput, honest: e.honestInput },
      round: e.round,
    });
  }

  if (e.ratio > CRITICAL_HIGH) {
    out.push({
      type: 'cost_mismatch',
      severity: 'critical',
      messageKey: 'anomaly.cost_ratio_critical',
      messageParams: { round: e.round, ratio: e.ratio.toFixed(2) },
      round: e.round,
    });
  } else if (e.ratio > TOLERANCE_HIGH) {
    out.push({
      type: 'cost_mismatch',
      severity: 'warning',
      messageKey: 'anomaly.cost_ratio_high',
      messageParams: { round: e.round, ratio: e.ratio.toFixed(2) },
      round: e.round,
    });
  }

  if (e.billedInput === 0 && e.billedOutput === 0) {
    out.push({
      type: 'missing_usage',
      severity: 'warning',
      messageKey: 'anomaly.missing_usage',
      messageParams: { round: e.round },
      round: e.round,
    });
  }

  return out;
}

// --- Summary-level anomalies ---

function detectOverallAnomalies(
  entries: AuditEntry[],
  overallRatio: number,
): Anomaly[] {
  const out: Anomaly[] = [];

  if (overallRatio > CRITICAL_HIGH) {
    out.push({
      type: 'cost_mismatch',
      severity: 'critical',
      messageKey: 'anomaly.overall_ratio_critical',
      messageParams: { ratio: overallRatio.toFixed(2) },
      round: null,
    });
  } else if (overallRatio > TOLERANCE_HIGH) {
    out.push({
      type: 'cost_mismatch',
      severity: 'warning',
      messageKey: 'anomaly.overall_ratio_high',
      messageParams: { ratio: overallRatio.toFixed(2) },
      round: null,
    });
  }

  const totalCreate = entries.reduce((s, e) => s + e.billedCacheCreate, 0);
  const totalRead = entries.reduce((s, e) => s + e.billedCacheRead, 0);
  if (totalCreate > 0 && totalRead === 0 && entries.length >= 3) {
    out.push({
      type: 'cache_anomaly',
      severity: 'info',
      messageKey: 'anomaly.cache_anomaly',
      messageParams: { create: totalCreate },
      round: null,
    });
  }

  return out;
}

// --- Main summarize function ---

export function summarize(
  entries: AuditEntry[],
  totalLatencyMs: number,
): AuditSummary {
  if (entries.length === 0) {
    return {
      entries: [],
      anomalies: [],
      totalBilledCost: 0,
      totalHonestCost: 0,
      overallRatio: 1,
      cacheHitRate: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalLatencyMs,
      tokensPerSecond: 0,
      anomalousRounds: 0,
    };
  }

  const totalBilledCost = entries.reduce((s, e) => s + e.billedCost, 0);
  const totalHonestCost = entries.reduce((s, e) => s + e.honestCost, 0);
  const overallRatio =
    totalHonestCost > 0 ? totalBilledCost / totalHonestCost : 1;

  const totalInputRaw = entries.reduce((s, e) => s + e.billedInput, 0);
  const totalCacheRead = entries.reduce((s, e) => s + e.billedCacheRead, 0);
  const totalCacheCreate = entries.reduce((s, e) => s + e.billedCacheCreate, 0);
  const cacheDenominator = totalInputRaw + totalCacheRead + totalCacheCreate;
  const cacheHitRate =
    cacheDenominator > 0 ? totalCacheRead / cacheDenominator : 0;

  const totalInputTokens = cacheDenominator;
  const totalOutputTokens = entries.reduce((s, e) => s + e.billedOutput, 0);
  const tokensPerSecond =
    totalLatencyMs > 0 ? totalOutputTokens / (totalLatencyMs / 1000) : 0;

  const anomalousRounds = entries.filter((e) => isAnomalous(e.ratio)).length;

  // Collect anomalies
  const anomalies: Anomaly[] = [];
  for (const e of entries) {
    anomalies.push(...detectEntryAnomalies(e));
  }
  anomalies.push(...detectOverallAnomalies(entries, overallRatio));

  return {
    entries,
    anomalies,
    totalBilledCost,
    totalHonestCost,
    overallRatio,
    cacheHitRate,
    totalInputTokens,
    totalOutputTokens,
    totalLatencyMs,
    tokensPerSecond,
    anomalousRounds,
  };
}
