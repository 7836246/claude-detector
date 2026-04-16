// Claude API pricing in USD per 1,000,000 tokens.
// Values reflect Anthropic's published pricing at the time of writing.
// Update this table whenever Anthropic revises pricing.

export interface ModelPricing {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheRead: number;
}

export const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-6': { input: 15, output: 75, cacheWrite5m: 18.75, cacheRead: 1.5 },
  'claude-opus-4-5': { input: 15, output: 75, cacheWrite5m: 18.75, cacheRead: 1.5 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheWrite5m: 3.75, cacheRead: 0.3 },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheWrite5m: 3.75, cacheRead: 0.3 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheWrite5m: 1.25, cacheRead: 0.1 },
};

export function getPricing(model: string): ModelPricing {
  const stripped = model.replace(/-\d{8}$/, '');
  return (
    PRICING[model] ??
    PRICING[stripped] ??
    PRICING['claude-opus-4-6']
  );
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheWrite?: number;
  cacheRead?: number;
}

export function computeCost(pricing: ModelPricing, usage: TokenUsage): number {
  return (
    (usage.input * pricing.input +
      usage.output * pricing.output +
      (usage.cacheWrite ?? 0) * pricing.cacheWrite5m +
      (usage.cacheRead ?? 0) * pricing.cacheRead) /
    1_000_000
  );
}
