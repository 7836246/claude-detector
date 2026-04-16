import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkEndpoint } from '../src/lib/ssrf';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    const table: Record<string, { address: string; family: number }[]> = {
      'api.anthropic.com':   [{ address: '104.18.0.1', family: 4 }],
      'public.example.com':  [{ address: '93.184.216.34', family: 4 }],
      'mixed.example.com':   [{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.5', family: 4 }],
      'internal.consul':     [{ address: '10.0.0.5', family: 4 }],
      'gce.metadata':        [{ address: '169.254.169.254', family: 4 }],
      'imds.aws':            [{ address: '169.254.169.254', family: 4 }],
      'cgnat.example.com':   [{ address: '100.64.0.5', family: 4 }],
      'v6pub.example.com':   [{ address: '2001:4860:4860::8888', family: 6 }],
      'v6loop.example.com':  [{ address: '::1', family: 6 }],
      'v6link.example.com':  [{ address: 'fe80::1', family: 6 }],
    };
    const rows = table[host];
    if (!rows) {
      const err = new Error('ENOTFOUND') as NodeJS.ErrnoException;
      err.code = 'ENOTFOUND';
      throw err;
    }
    return rows;
  }),
}));

beforeEach(() => {
  delete process.env.ALLOW_PRIVATE_TARGETS;
});

describe('checkEndpoint', () => {
  it('accepts a public https hostname', async () => {
    const r = await checkEndpoint('https://api.anthropic.com/v1');
    expect(r.ok).toBe(true);
  });

  it('rejects non-http schemes', async () => {
    const r = await checkEndpoint('ftp://example.com/');
    expect(r).toEqual({ ok: false, reason: 'scheme' });
  });

  it('rejects userinfo in URL', async () => {
    const r = await checkEndpoint('https://user:pw@api.anthropic.com');
    expect(r).toEqual({ ok: false, reason: 'userinfo' });
  });

  it('rejects private IPv4 literals', async () => {
    for (const ip of ['http://127.0.0.1', 'http://10.0.0.1', 'http://172.16.0.1', 'http://192.168.1.1', 'http://0.0.0.0']) {
      const r = await checkEndpoint(ip);
      expect(r, `expected ${ip} to be rejected`).toEqual({ ok: false, reason: 'private' });
    }
  });

  it('rejects link-local (IMDS) and CGNAT literals', async () => {
    const r1 = await checkEndpoint('http://169.254.169.254/latest/meta-data/');
    expect(r1).toEqual({ ok: false, reason: 'private' });
    const r2 = await checkEndpoint('http://100.64.0.1');
    expect(r2).toEqual({ ok: false, reason: 'private' });
  });

  it('rejects IPv6 loopback / link-local / ULA', async () => {
    for (const raw of ['http://[::1]', 'http://[fe80::1]', 'http://[fc00::1]']) {
      const r = await checkEndpoint(raw);
      expect(r, `expected ${raw} to be rejected`).toEqual({ ok: false, reason: 'private' });
    }
  });

  it('accepts public IPv6 literal', async () => {
    const r = await checkEndpoint('https://[2001:4860:4860::8888]/');
    expect(r.ok).toBe(true);
  });

  it('rejects localhost and .local hostnames before DNS', async () => {
    for (const host of ['http://localhost', 'http://my.local']) {
      const r = await checkEndpoint(host);
      expect(r, `expected ${host} to be rejected`).toEqual({ ok: false, reason: 'private' });
    }
  });

  it('rejects hostnames that resolve to private addresses', async () => {
    const r = await checkEndpoint('https://internal.consul/');
    expect(r).toEqual({ ok: false, reason: 'private' });
  });

  it('rejects if ANY resolved address is private (dual-stack pinning)', async () => {
    const r = await checkEndpoint('https://mixed.example.com/');
    expect(r).toEqual({ ok: false, reason: 'private' });
  });

  it('rejects hostnames that fail DNS resolution', async () => {
    const r = await checkEndpoint('https://does-not-exist.invalid/');
    expect(r).toEqual({ ok: false, reason: 'dns' });
  });

  it('rejects metadata service hostnames that resolve to 169.254/16', async () => {
    const r = await checkEndpoint('https://gce.metadata/');
    expect(r).toEqual({ ok: false, reason: 'private' });
  });

  it('accepts private targets when ALLOW_PRIVATE_TARGETS=1', async () => {
    process.env.ALLOW_PRIVATE_TARGETS = '1';
    // Re-import to re-read env; use a dynamic import to avoid module cache
    vi.resetModules();
    const { checkEndpoint: checkWithAllow } = await import('../src/lib/ssrf');
    const r = await checkWithAllow('http://127.0.0.1:4321');
    expect(r.ok).toBe(true);
  });

  it('rejects malformed URLs', async () => {
    const r = await checkEndpoint('not a url');
    expect(r).toEqual({ ok: false, reason: 'hostname' });
  });
});
