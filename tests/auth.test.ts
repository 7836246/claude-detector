import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAdminToken, verifyAdminToken, isAdminConfigured } from '../src/lib/auth';

const ORIG = process.env.ADMIN_PASSWORD;

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'test-password';
});

afterEach(() => {
  if (ORIG === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIG;
});

describe('admin auth', () => {
  it('createAdminToken returns a hex digest when configured', () => {
    const token = createAdminToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('verifyAdminToken accepts its own token', () => {
    const token = createAdminToken();
    expect(verifyAdminToken(token)).toBe(true);
  });

  it('verifyAdminToken rejects undefined / empty / mismatched tokens', () => {
    expect(verifyAdminToken(undefined)).toBe(false);
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminToken('x'.repeat(64))).toBe(false);
  });

  it('verifyAdminToken rejects a token of wrong length', () => {
    expect(verifyAdminToken('a'.repeat(32))).toBe(false);
  });

  it('isAdminConfigured reflects env presence', () => {
    expect(isAdminConfigured()).toBe(true);
    process.env.ADMIN_PASSWORD = '';
    expect(isAdminConfigured()).toBe(false);
  });
});
