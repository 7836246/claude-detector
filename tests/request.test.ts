import { describe, it, expect } from 'vitest';
import { extractClientIp, sanitizeEndpointForStorage } from '../src/lib/request';

function h(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe('extractClientIp', () => {
  it('prefers X-Real-IP when present', () => {
    const ip = extractClientIp(h({ 'x-real-ip': '203.0.113.5' }), '127.0.0.1');
    expect(ip).toBe('203.0.113.5');
  });

  it('falls back to first X-Forwarded-For entry', () => {
    const ip = extractClientIp(h({ 'x-forwarded-for': '198.51.100.7, 10.0.0.1' }), '127.0.0.1');
    expect(ip).toBe('198.51.100.7');
  });

  it('ignores malformed header values', () => {
    const ip = extractClientIp(h({ 'x-real-ip': 'not-an-ip' }), '127.0.0.1');
    expect(ip).toBe('127.0.0.1');
  });

  it('uses fallback when no trusted header is set', () => {
    const ip = extractClientIp(h({}), '203.0.113.10');
    expect(ip).toBe('203.0.113.10');
  });
});

describe('sanitizeEndpointForStorage', () => {
  it('strips query string and fragment', () => {
    const out = sanitizeEndpointForStorage('https://api.example.com/v1/messages?key=secret#part');
    expect(out).toBe('https://api.example.com/v1/messages');
  });

  it('strips userinfo', () => {
    const out = sanitizeEndpointForStorage('https://user:pw@api.example.com/');
    expect(out).toBe('https://api.example.com');
  });

  it('trims trailing slashes', () => {
    const out = sanitizeEndpointForStorage('https://api.example.com/v1///');
    expect(out).toBe('https://api.example.com/v1');
  });

  it('tolerates invalid URLs', () => {
    const out = sanitizeEndpointForStorage('garbage?query#frag');
    expect(out).toBe('garbage');
  });
});
