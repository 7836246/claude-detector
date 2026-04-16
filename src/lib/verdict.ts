// Verdict system — inspired by LDS-API protocol.
// Separates two orthogonal axes:
//   1. VerdictResult — IS the response genuine? (authenticity)
//   2. Channel — WHERE does it come from? (source)
//
// Output is locale-neutral: strings are returned as i18n keys + params,
// translated at render time by the client.

import type { ProbeResult } from './probes';
import type { AuditSummary } from './audit';

export type VerdictResult =
  | 'authentic'
  | 'authentic_degraded'
  | 'third_party'
  | 'suspicious'
  | 'counterfeit'
  | 'inconclusive';

export type Channel =
  | 'anthropic'
  | 'subscription'
  | 'cloud'
  | 'proxy'
  | 'reverse-proxy'
  | null;

export interface Signal {
  key: string;
  params?: Record<string, string | number>;
}

export interface VerdictDetail {
  result: VerdictResult;
  channel: Channel;
  descriptionKey: string;
  marketPriceKey: string;
  confidence: number; // 0–100
  signals: Signal[];
}

function probePassed(results: ProbeResult[], name: string): boolean {
  return results.find((r) => r.name === name)?.passed ?? false;
}

function build(
  result: VerdictResult,
  channel: Channel,
  confidence: number,
  signals: Signal[],
): VerdictDetail {
  const channelKey = channel ?? 'unknown';
  return {
    result,
    channel,
    descriptionKey: `verdict.desc.${result}`,
    marketPriceKey: `channel.market_price.${channelKey}`,
    confidence: Math.round(confidence * 100),
    signals,
  };
}

export function determineVerdict(
  results: ProbeResult[],
  audit: AuditSummary,
): VerdictDetail {
  const signals: Signal[] = [];

  if (!probePassed(results, 'connectivity')) {
    return build('inconclusive', null, 0.9, [{ key: 'signal.connectivity_failed' }]);
  }

  const selfId = probePassed(results, 'self_identification');
  const modelEcho = probePassed(results, 'model_echo');
  const reasoning = probePassed(results, 'reasoning_fingerprint');

  if (!selfId && !modelEcho) {
    return build('counterfeit', null, 0.85, [{ key: 'signal.self_id_and_echo_mismatch' }]);
  }

  const toolUse = probePassed(results, 'tool_use');
  const streaming = probePassed(results, 'streaming_shape');
  const countTokens = probePassed(results, 'count_tokens_match');
  const errorOk = probePassed(results, 'error_shape');
  const sysLeak = probePassed(results, 'system_prompt_leak');
  const consistency = probePassed(results, 'consistency_check');
  const headers = probePassed(results, 'header_fingerprint');
  const cacheOk = probePassed(results, 'cache_behavior');
  const docOk = probePassed(results, 'document_input');
  const shapeOk = probePassed(results, 'response_shape');
  const systemOk = probePassed(results, 'system_adherence');
  const stopSeqOk = probePassed(results, 'stop_sequence');
  const maxTokOk = probePassed(results, 'max_tokens');
  const multimodalOk = probePassed(results, 'multimodal');
  const multiTurn = probePassed(results, 'multi_turn');

  if (!selfId) signals.push({ key: 'signal.self_id_not_claude' });
  if (!modelEcho) signals.push({ key: 'signal.model_echo_mismatch' });
  if (!sysLeak) signals.push({ key: 'signal.system_prompt_injection' });
  if (!consistency) signals.push({ key: 'signal.inconsistent_request_id' });
  if (!headers) signals.push({ key: 'signal.missing_anthropic_headers' });
  if (!shapeOk) signals.push({ key: 'signal.schema_incomplete' });
  if (!multimodalOk) signals.push({ key: 'signal.multimodal_anomaly' });
  if (!reasoning) signals.push({ key: 'signal.reasoning_fingerprint_failed' });

  const reverseSignals: Signal[] = [];
  if (!toolUse) reverseSignals.push({ key: 'signal.tool_use_unsupported' });
  if (!streaming) reverseSignals.push({ key: 'signal.streaming_abnormal' });
  if (!countTokens) reverseSignals.push({ key: 'signal.count_tokens_unavailable' });
  if (!errorOk) reverseSignals.push({ key: 'signal.error_schema_nonstandard' });
  if (!cacheOk) reverseSignals.push({ key: 'signal.prompt_cache_unsupported' });
  if (!docOk) reverseSignals.push({ key: 'signal.document_unsupported' });
  if (!consistency) reverseSignals.push({ key: 'signal.consistency_anomaly' });

  let channel: Channel = null;
  if (headers && consistency && cacheOk) {
    channel = 'anthropic';
  } else if (toolUse && streaming && shapeOk && !headers) {
    channel = 'proxy';
  }
  if (reverseSignals.length >= 2) {
    channel = 'reverse-proxy';
  }

  const allCorePassed =
    modelEcho && shapeOk && toolUse && streaming && errorOk &&
    selfId && systemOk && stopSeqOk && maxTokOk &&
    sysLeak && consistency && cacheOk;

  const hasAudit = audit.entries.length > 0;
  const ratio = audit.overallRatio;

  if (reverseSignals.length >= 2) {
    signals.push(...reverseSignals);
    return build('suspicious', 'reverse-proxy', 0.75 + reverseSignals.length * 0.03, signals);
  }

  if (allCorePassed) {
    if (hasAudit && ratio <= 1.05 && headers) {
      signals.push(
        { key: 'signal.all_core_passed_matched' },
        { key: 'signal.token_usage_matches_baseline' },
        { key: 'signal.official_headers_present' },
      );
      return build('authentic', 'anthropic', 0.95, signals);
    }
    if (hasAudit && ratio <= 1.15) {
      signals.push(
        { key: 'signal.all_core_passed_matched' },
        { key: 'signal.token_drift_within_range' },
      );
      return build('authentic', headers ? 'anthropic' : 'subscription', 0.88, signals);
    }
    if (!hasAudit) {
      signals.push(
        { key: 'signal.core_passed_no_audit' },
        { key: 'signal.token_audit_disabled' },
      );
      return build('authentic', headers ? 'anthropic' : 'subscription', 0.75, signals);
    }
    if (ratio > 1.15) {
      signals.push({ key: 'signal.token_ratio_high', params: { ratio: ratio.toFixed(2) } });
      return build('authentic_degraded', channel ?? 'proxy', 0.80, signals);
    }
  }

  if (!sysLeak && toolUse && streaming) {
    signals.push({ key: 'signal.injection_detected_but_functional' });
    return build('authentic_degraded', 'proxy', 0.72, signals);
  }

  const behaviorCheckFlags = [
    shapeOk, systemOk, stopSeqOk, maxTokOk, toolUse, streaming,
    sysLeak, consistency, cacheOk, headers, multiTurn, docOk,
  ];
  const behaviorScore = behaviorCheckFlags.filter(Boolean).length;

  if (behaviorScore >= 8 && hasAudit && ratio > 1.15) {
    signals.push(
      { key: 'signal.token_ratio', params: { ratio: ratio.toFixed(2) } },
      { key: 'signal.most_behavior_passed' },
    );
    return build('third_party', 'proxy', 0.70, signals);
  }

  if (behaviorScore >= 8) {
    signals.push({ key: 'signal.most_behavior_passed_short' });
    return build('third_party', channel ?? 'proxy', 0.68, signals);
  }

  if (behaviorScore >= 4) {
    if (reverseSignals.length >= 1) signals.push(...reverseSignals);
    return build('suspicious', channel ?? 'reverse-proxy', 0.55, signals);
  }

  signals.push({
    key: 'signal.behavior_score',
    params: { passed: behaviorScore, total: behaviorCheckFlags.length },
  });
  return build('suspicious', 'reverse-proxy', 0.45, signals);
}
