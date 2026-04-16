// Minimal fetch wrapper for the Anthropic Messages API.
// Used by probes to hit `/v1/messages` and `/v1/messages/count_tokens`
// against whatever endpoint the user supplies.

export const ANTHROPIC_VERSION = '2023-06-01';

export interface CallOptions {
  endpoint: string;
  apiKey: string;
  path: '/v1/messages' | '/v1/messages/count_tokens';
  body: unknown;
  signal?: AbortSignal;
  stream?: boolean;
  timeoutMs?: number;
}

export interface CallResult {
  res: Response;
  latencyMs: number;
}

function normEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

export async function call({
  endpoint,
  apiKey,
  path,
  body,
  signal,
  stream = false,
  timeoutMs = 30_000,
}: CallOptions): Promise<CallResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error('timeout')), timeoutMs);
  const sig = signal
    ? AbortSignal.any([signal, ctrl.signal])
    : ctrl.signal;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
    'user-agent': 'claude-cli/2.1.109 (external, cli)',
  };
  if (stream) headers['accept'] = 'text/event-stream';

  const t0 = performance.now();
  try {
    const res = await fetch(`${normEndpoint(endpoint)}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: sig,
    });
    return { res, latencyMs: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

export async function readJson<T = any>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Independent token recount. Returns null if the endpoint rejects or
// responds with an unexpected shape — callers treat that as "no honest
// baseline available" and skip the audit math rather than failing.
export async function countTokens(
  ctx: { endpoint: string; apiKey: string; model: string },
  messages: unknown,
  system?: string,
  signal?: AbortSignal,
): Promise<number | null> {
  try {
    const body: Record<string, unknown> = { model: ctx.model, messages };
    if (system) body.system = system;
    const { res } = await call({
      endpoint: ctx.endpoint,
      apiKey: ctx.apiKey,
      path: '/v1/messages/count_tokens',
      body,
      timeoutMs: 15_000,
      signal,
    });
    if (!res.ok) return null;
    const data = await readJson<{ input_tokens?: number }>(res);
    return typeof data?.input_tokens === 'number' ? data.input_tokens : null;
  } catch {
    return null;
  }
}

// Read an SSE response, return ordered list of `event:` names and final accumulated text.
export async function readSseEvents(
  res: Response,
  maxEvents = 200,
): Promise<{ events: string[]; firstTokenMs: number | null }> {
  const events: string[] = [];
  if (!res.body) return { events, firstTokenMs: null };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let firstTokenMs: number | null = null;
  const t0 = performance.now();

  while (events.length < maxEvents) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const name = line.slice(7).trim();
        events.push(name);
        if (
          firstTokenMs === null &&
          (name === 'content_block_delta' || name === 'content_block_start')
        ) {
          firstTokenMs = Math.round(performance.now() - t0);
        }
      }
    }
  }
  try {
    reader.cancel();
  } catch {
    // ignore
  }
  return { events, firstTokenMs };
}
