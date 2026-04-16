// Verdict system — inspired by LDS-API protocol.
// Separates two orthogonal axes:
//   1. VerdictResult — IS the response genuine? (authenticity)
//   2. Channel — WHERE does it come from? (source)

import type { ProbeResult } from './probes';
import type { AuditSummary } from './audit';

// --- Result: is it real? ---

export type VerdictResult =
  | 'authentic'          // Genuine, behaves exactly like official API
  | 'authentic_degraded' // Genuine model but with issues (injection, inflation)
  | 'third_party'        // Real Claude via non-official channel (clean proxy)
  | 'suspicious'         // Multiple anomalies, may be tampered
  | 'counterfeit'        // Definitely not the claimed model
  | 'inconclusive';      // Can't determine (connectivity failure, insufficient data)

// --- Channel: where from? ---

export type Channel =
  | 'anthropic'      // Direct Anthropic Console API
  | 'subscription'   // Claude Max / Pro subscription
  | 'cloud'          // AWS Bedrock / GCP Vertex / Azure (legitimate redistributor)
  | 'proxy'          // Third-party proxy/relay
  | 'reverse-proxy'  // Reverse-engineered from web/app
  | null;            // Can't determine

// --- Combined verdict ---

export interface VerdictDetail {
  result: VerdictResult;
  channel: Channel;
  label: string;
  description: string;
  marketPrice: string;
  confidence: number; // 0.0–1.0
  signals: string[];
}

// Labels (Chinese)
const RESULT_LABELS: Record<VerdictResult, string> = {
  authentic: '正品',
  authentic_degraded: '正品 (有瑕疵)',
  third_party: '第三方转发',
  suspicious: '存疑',
  counterfeit: '假冒',
  inconclusive: '无法判定',
};

const CHANNEL_LABELS: Record<string, string> = {
  anthropic: 'Anthropic 官方 API',
  subscription: 'Claude Max / Pro 订阅',
  cloud: '云平台 (Bedrock / Vertex)',
  proxy: '第三方中转站',
  'reverse-proxy': '逆向接入',
};

const RESULT_DESCRIPTIONS: Record<VerdictResult, string> = {
  authentic: '所有检测项通过,接口行为与官方 API 完全一致,可放心使用',
  authentic_degraded: '模型是真的,但检测到额外注入或轻微计费偏差,功能不受影响',
  third_party: '真实 Claude 模型,通过非官方渠道转发,功能正常',
  suspicious: '多项指标异常,可能被篡改或降级,建议谨慎使用',
  counterfeit: '响应特征与 Claude 不符,疑似使用其他模型冒充',
  inconclusive: '连通性测试失败或数据不足,无法做出判定',
};

const MARKET_PRICES: Record<string, string> = {
  anthropic: '官方定价 (Opus: $15/$75 per 1M)',
  subscription: 'Claude Max ~$200/月 或 Pro $20/月',
  cloud: '云平台加价 ~1.2-1.5x 官方',
  proxy: '中转约 2-3 元/刀',
  'reverse-proxy': '逆向约 0.5-1.5 元/刀',
  unknown: '—',
};

// --- Helpers ---

function probePassed(results: ProbeResult[], name: string): boolean {
  return results.find((r) => r.name === name)?.passed ?? false;
}

// --- Decision tree ---

export function determineVerdict(
  results: ProbeResult[],
  audit: AuditSummary,
): VerdictDetail {
  const signals: string[] = [];

  // Shortcut: connectivity failure
  if (!probePassed(results, 'connectivity')) {
    return verdict('inconclusive', null, 0.9, ['连通性测试失败,无法建立连接或鉴权失败']);
  }

  // --- Counterfeit detection ---
  const selfId = probePassed(results, 'self_identification');
  const modelEcho = probePassed(results, 'model_echo');
  const reasoning = probePassed(results, 'reasoning_fingerprint');

  if (!selfId && !modelEcho) {
    return verdict('counterfeit', null, 0.85, [
      '模型自报身份非 Claude 且 response.model 不匹配',
    ]);
  }

  // --- Channel + authenticity signals ---
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

  // Collect signals
  if (!selfId) signals.push('模型未自报为 Claude/Anthropic');
  if (!modelEcho) signals.push('response.model 与请求不匹配');
  if (!sysLeak) signals.push('检测到隐藏 System Prompt 注入');
  if (!consistency) signals.push('请求 ID 重复或 input_tokens 不一致');
  if (!headers) signals.push('响应头缺少 Anthropic 特征');
  if (!shapeOk) signals.push('响应 Schema 不完整');
  if (!multimodalOk) signals.push('多模态输入异常');
  if (!reasoning) signals.push('推理指纹未通过');

  // Reverse-engineering signals
  const reverseSignals = [
    !toolUse && 'tool_use 不支持',
    !streaming && 'SSE 流式异常',
    !countTokens && 'count_tokens 不可用',
    !errorOk && '错误格式非官方 Schema',
    !cacheOk && 'Prompt Caching 不支持',
    !docOk && 'PDF 文档输入不支持',
    !consistency && '请求一致性异常',
  ].filter(Boolean) as string[];

  // --- Determine channel ---
  let channel: Channel = null;
  if (headers && consistency && cacheOk) {
    channel = 'anthropic'; // Has official headers + caching + consistency
  } else if (toolUse && streaming && shapeOk && !headers) {
    channel = 'proxy'; // Works but missing official headers
  }
  if (reverseSignals.length >= 2) {
    channel = 'reverse-proxy';
  }

  // --- Determine result ---

  // Full core checks
  const allCorePassed =
    modelEcho && shapeOk && toolUse && streaming && errorOk &&
    selfId && systemOk && stopSeqOk && maxTokOk &&
    sysLeak && consistency && cacheOk;

  const hasAudit = audit.entries.length > 0;
  const ratio = audit.overallRatio;

  // Reverse-engineered
  if (reverseSignals.length >= 2) {
    signals.push(...reverseSignals);
    return verdict('suspicious', 'reverse-proxy', 0.75 + reverseSignals.length * 0.03, signals);
  }

  // All core pass → authentic or authentic_degraded
  if (allCorePassed) {
    if (hasAudit && ratio <= 1.05 && headers) {
      signals.push('所有核心检测通过', 'Token 用量与官方基线一致', '官方响应头完整');
      return verdict('authentic', 'anthropic', 0.95, signals);
    }
    if (hasAudit && ratio <= 1.15) {
      signals.push('所有核心检测通过', 'Token 偏差在正常范围');
      return verdict('authentic', headers ? 'anthropic' : 'subscription', 0.88, signals);
    }
    if (!hasAudit) {
      signals.push('核心检测通过', '未启用 Token 审计');
      return verdict('authentic', headers ? 'anthropic' : 'subscription', 0.75, signals);
    }
    // All pass but ratio high
    if (ratio > 1.15) {
      signals.push(`Token 倍率 ${ratio.toFixed(2)}x 偏高`);
      return verdict('authentic_degraded', channel ?? 'proxy', 0.80, signals);
    }
  }

  // System prompt injection detected
  if (!sysLeak && toolUse && streaming) {
    signals.push('功能正常但检测到隐藏 Prompt 注入');
    return verdict('authentic_degraded', 'proxy', 0.72, signals);
  }

  // Behavior score
  const behaviorScore = [
    shapeOk, systemOk, stopSeqOk, maxTokOk, toolUse, streaming,
    sysLeak, consistency, cacheOk, headers, multiTurn, docOk,
  ].filter(Boolean).length;

  // Most pass + ratio high → third_party with inflation
  if (behaviorScore >= 8 && hasAudit && ratio > 1.15) {
    signals.push(`Token 倍率 ${ratio.toFixed(2)}x`, '大部分功能正常');
    return verdict('third_party', 'proxy', 0.70, signals);
  }

  // Most pass + ratio OK → clean third_party
  if (behaviorScore >= 8) {
    signals.push('大部分功能检测通过');
    return verdict('third_party', channel ?? 'proxy', 0.68, signals);
  }

  // Low pass rate
  if (behaviorScore >= 4) {
    if (reverseSignals.length >= 1) signals.push(...reverseSignals);
    return verdict('suspicious', channel ?? 'reverse-proxy', 0.55, signals);
  }

  // Very low
  signals.push(`行为检测通过 ${behaviorScore}/12`);
  return verdict('suspicious', 'reverse-proxy', 0.45, signals);
}

function verdict(
  result: VerdictResult,
  channel: Channel,
  confidence: number,
  signals: string[],
): VerdictDetail {
  const channelKey = channel ?? 'unknown';
  return {
    result,
    channel,
    label: `${RESULT_LABELS[result]} · ${CHANNEL_LABELS[channelKey] ?? '来源未知'}`,
    description: RESULT_DESCRIPTIONS[result],
    marketPrice: MARKET_PRICES[channelKey] ?? '—',
    confidence: Math.round(confidence * 100),
    signals,
  };
}

// Keep backward compat: old code references .tier
export type VerdictTier = VerdictResult;
