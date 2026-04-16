import { isIP } from 'node:net';

const TRUST_PROXY = process.env.TRUST_PROXY !== '0';

export function extractClientIp(
  headers: Headers,
  fallback: string | undefined,
): string {
  if (TRUST_PROXY) {
    const real = headers.get('x-real-ip');
    if (real && isIP(real.trim())) return real.trim();
    const xff = headers.get('x-forwarded-for');
    if (xff) {
      const first = xff.split(',')[0]?.trim();
      if (first && isIP(first)) return first;
    }
  }
  return fallback ?? '127.0.0.1';
}

export function sanitizeEndpointForStorage(endpoint: string): string {
  try {
    const u = new URL(endpoint);
    u.username = '';
    u.password = '';
    u.search = '';
    u.hash = '';
    return u.toString().replace(/\/+$/, '');
  } catch {
    return endpoint.split('?')[0]?.split('#')[0] ?? '';
  }
}
