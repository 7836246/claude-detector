import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const ALLOW_PRIVATE = process.env.ALLOW_PRIVATE_TARGETS === '1';

export type EndpointCheck =
  | { ok: true; url: string; host: string }
  | { ok: false; reason: 'scheme' | 'userinfo' | 'hostname' | 'dns' | 'private' };

function isPrivateV4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local (includes IMDS)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.slice(7);
    if (isIP(v4) === 4) return isPrivateV4(v4);
  }
  return false;
}

function isPrivateAddress(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) return isPrivateV4(ip);
  if (fam === 6) return isPrivateV6(ip);
  return true;
}

export async function checkEndpoint(raw: string): Promise<EndpointCheck> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'hostname' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'scheme' };
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'userinfo' };
  }
  const host = url.hostname;
  if (!host) return { ok: false, reason: 'hostname' };

  if (ALLOW_PRIVATE) {
    return { ok: true, url: url.toString(), host };
  }

  // Strip IPv6 brackets
  const bare = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;

  if (isIP(bare)) {
    if (isPrivateAddress(bare)) return { ok: false, reason: 'private' };
    return { ok: true, url: url.toString(), host };
  }

  // Reject localhost and related aliases up front
  const lowerHost = bare.toLowerCase();
  if (lowerHost === 'localhost' || lowerHost.endsWith('.localhost') || lowerHost.endsWith('.local')) {
    return { ok: false, reason: 'private' };
  }

  try {
    const resolved = await lookup(bare, { all: true });
    if (resolved.length === 0) return { ok: false, reason: 'dns' };
    for (const r of resolved) {
      if (isPrivateAddress(r.address)) return { ok: false, reason: 'private' };
    }
  } catch {
    return { ok: false, reason: 'dns' };
  }
  return { ok: true, url: url.toString(), host };
}
