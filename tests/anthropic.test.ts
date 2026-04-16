import { describe, it, expect, vi, afterEach } from 'vitest';
import { readSseEvents, countTokens, ANTHROPIC_VERSION } from '../src/lib/anthropic';

afterEach(() => {
  vi.restoreAllMocks();
});

function sseResponse(chunks: string[]): Response {
  const stream = new ReadableStream({
    start(ctrl) {
      const enc = new TextEncoder();
      for (const c of chunks) ctrl.enqueue(enc.encode(c));
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
}

describe('readSseEvents', () => {
  it('captures ordered event names + TTFT', async () => {
    const body = [
      'event: message_start\ndata: {}\n\n',
      'event: content_block_start\ndata: {}\n\n',
      'event: content_block_delta\ndata: {}\n\n',
      'event: message_stop\ndata: {}\n\n',
    ];
    const res = sseResponse(body);
    const { events, firstTokenMs } = await readSseEvents(res);
    expect(events).toEqual(['message_start', 'content_block_start', 'content_block_delta', 'message_stop']);
    expect(firstTokenMs).not.toBeNull();
  });

  it('returns empty when body is null', async () => {
    const res = new Response(null);
    const { events, firstTokenMs } = await readSseEvents(res);
    expect(events).toEqual([]);
    expect(firstTokenMs).toBeNull();
  });

  it('stops at maxEvents', async () => {
    const chunks = Array.from({ length: 10 }, (_, i) => `event: e${i}\ndata: {}\n\n`);
    const { events } = await readSseEvents(sseResponse(chunks), 3);
    expect(events).toHaveLength(3);
  });
});

describe('countTokens', () => {
  it('returns the count when upstream responds ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ input_tokens: 42 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const n = await countTokens(
      { endpoint: 'https://api.anthropic.com', apiKey: 'k', model: 'claude' },
      [{ role: 'user', content: 'hi' }],
    );
    expect(n).toBe(42);
  });

  it('returns null on non-2xx', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('{}', { status: 400 }),
    );
    const n = await countTokens(
      { endpoint: 'https://api.anthropic.com', apiKey: 'k', model: 'claude' },
      [],
    );
    expect(n).toBeNull();
  });

  it('returns null on malformed payload', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('{ "garbage": true }', { status: 200 }),
    );
    const n = await countTokens(
      { endpoint: 'https://api.anthropic.com', apiKey: 'k', model: 'claude' },
      [],
    );
    expect(n).toBeNull();
  });

  it('returns null on fetch rejection', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('boom'));
    const n = await countTokens(
      { endpoint: 'https://api.anthropic.com', apiKey: 'k', model: 'claude' },
      [],
    );
    expect(n).toBeNull();
  });

  it('sends the configured anthropic-version header', async () => {
    const spy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ input_tokens: 1 }), { status: 200 }),
    );
    await countTokens(
      { endpoint: 'https://api.anthropic.com', apiKey: 'k', model: 'claude' },
      [],
    );
    const init = spy.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['anthropic-version']).toBe(ANTHROPIC_VERSION);
    expect(headers['x-api-key']).toBe('k');
  });
});
