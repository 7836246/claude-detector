import { describe, it, expect, vi } from 'vitest';
import { runProbes } from '../src/lib/runner';
import type { Probe, ProbeContext } from '../src/lib/probes';

vi.mock('../src/lib/probes', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../src/lib/probes')>();
  const stubs: Probe[] = [
    {
      name: 'a',
      label: 'Alpha',
      category: 'structural',
      weight: 1,
      run: async () => ({ passed: true, score: 1, detail: 'ok' }),
    },
    {
      name: 'b',
      label: 'Bravo',
      category: 'behavior',
      weight: 1,
      run: async () => {
        throw new Error('boom');
      },
    },
    {
      name: 'c',
      label: 'Charlie',
      category: 'token_audit',
      weight: 1,
      auditOnly: true,
      run: async () => ({ passed: true, score: 1, detail: 'audit' }),
    },
  ];
  return { ...orig, PROBES: stubs };
});

const ctx: ProbeContext = { endpoint: 'https://x', apiKey: 'k', model: 'claude' };

describe('runProbes', () => {
  it('emits start → probe_start/result pairs → done', async () => {
    const seen: string[] = [];
    for await (const ev of runProbes(ctx)) {
      seen.push(ev.type);
    }
    expect(seen[0]).toBe('start');
    expect(seen[seen.length - 1]).toBe('done');
    expect(seen.filter((t) => t === 'probe_start')).toHaveLength(2);
    expect(seen.filter((t) => t === 'probe_result')).toHaveLength(2);
  });

  it('skips auditOnly probes when tokenAudit is off', async () => {
    let total = -1;
    for await (const ev of runProbes(ctx)) {
      if (ev.type === 'start') total = ev.total;
    }
    expect(total).toBe(2);
  });

  it('includes auditOnly probes when tokenAudit is on', async () => {
    let total = -1;
    for await (const ev of runProbes({ ...ctx, tokenAudit: true })) {
      if (ev.type === 'start') total = ev.total;
    }
    expect(total).toBe(3);
  });

  it('marks exceptions as failing probe_results without aborting the run', async () => {
    const results: Array<{ name: string; passed: boolean; detail: string }> = [];
    for await (const ev of runProbes(ctx)) {
      if (ev.type === 'probe_result') {
        results.push({
          name: ev.result.name,
          passed: ev.result.passed,
          detail: ev.result.detail,
        });
      }
    }
    const b = results.find((r) => r.name === 'b');
    expect(b?.passed).toBe(false);
    expect(b?.detail).toMatch(/boom/);
  });

  it('propagates AbortError by throwing', async () => {
    vi.resetModules();
    vi.doMock('../src/lib/probes', async (importOriginal) => {
      const orig = await importOriginal<typeof import('../src/lib/probes')>();
      return {
        ...orig,
        PROBES: [
          {
            name: 'abort',
            label: 'abort',
            category: 'structural',
            weight: 1,
            run: async () => {
              const e = new Error('aborted');
              e.name = 'AbortError';
              throw e;
            },
          } satisfies Probe,
        ],
      };
    });
    const { runProbes: runFresh } = await import('../src/lib/runner');
    await expect(async () => {
      for await (const _ev of runFresh(ctx)) {
        // consume
      }
    }).rejects.toThrow(/aborted/);
    // cleanup so other tests re-import the original mock
    vi.resetModules();
  });
});
