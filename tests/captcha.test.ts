import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/lib/db', () => {
  const store = new Map<string, string>();
  return {
    getConfig: (key: string) => store.get(key) ?? null,
    setConfig: (key: string, value: string) => store.set(key, value),
    __setConfig: (key: string, value: string) => store.set(key, value),
    __clearConfig: () => store.clear(),
  };
});

import { verifyCaptcha, invalidateCaptchaCache } from '../src/lib/captcha';
import * as db from '../src/lib/db';

const testDb = db as unknown as {
  __setConfig: (k: string, v: string) => void;
  __clearConfig: () => void;
};

beforeEach(() => {
  testDb.__clearConfig();
  invalidateCaptchaCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('verifyCaptcha', () => {
  it('provider=none always returns true', async () => {
    testDb.__setConfig('captcha_provider', 'none');
    expect(await verifyCaptcha('anything')).toBe(true);
  });

  it('returns false when token is empty', async () => {
    testDb.__setConfig('captcha_provider', 'turnstile');
    testDb.__setConfig('captcha_secret_key', 'secret');
    expect(await verifyCaptcha('')).toBe(false);
  });

  it('returns false when secret is unset', async () => {
    testDb.__setConfig('captcha_provider', 'turnstile');
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('turnstile: success=true → accept', async () => {
    testDb.__setConfig('captcha_provider', 'turnstile');
    testDb.__setConfig('captcha_secret_key', 'secret');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok', { ip: '1.2.3.4' })).toBe(true);
  });

  it('turnstile: success=false → reject', async () => {
    testDb.__setConfig('captcha_provider', 'turnstile');
    testDb.__setConfig('captcha_secret_key', 'secret');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('turnstile: rejects on fetch error', async () => {
    testDb.__setConfig('captcha_provider', 'turnstile');
    testDb.__setConfig('captcha_secret_key', 'secret');
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('net'));
    expect(await verifyCaptcha('tok')).toBe(false);
  });

  it('tencent: requires ticket:randstr format and appid', async () => {
    testDb.__setConfig('captcha_provider', 'tencent');
    testDb.__setConfig('captcha_secret_key', 'secret');
    // Missing appid
    expect(await verifyCaptcha('ticket:rand')).toBe(false);

    testDb.__setConfig('captcha_tencent_appid', '123');
    invalidateCaptchaCache();
    // Missing separator
    expect(await verifyCaptcha('no-colon')).toBe(false);

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ response: '1' }), { status: 200 }),
    );
    expect(await verifyCaptcha('ticket:rand')).toBe(true);
  });

  it('hcaptcha: success=true → accept', async () => {
    testDb.__setConfig('captcha_provider', 'hcaptcha');
    testDb.__setConfig('captcha_secret_key', 'secret');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok')).toBe(true);
  });

  it('recaptcha: requires score ≥ 0.5', async () => {
    testDb.__setConfig('captcha_provider', 'recaptcha');
    testDb.__setConfig('captcha_secret_key', 'secret');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, score: 0.3 }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok')).toBe(false);

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, score: 0.8 }), { status: 200 }),
    );
    expect(await verifyCaptcha('tok')).toBe(true);
  });
});

describe('captcha config caching', () => {
  it('invalidateCaptchaCache forces re-read', async () => {
    testDb.__setConfig('captcha_provider', 'none');
    expect(await verifyCaptcha('x')).toBe(true);

    testDb.__setConfig('captcha_provider', 'turnstile');
    // Cache still says "none" until invalidated
    expect(await verifyCaptcha('x')).toBe(true);

    invalidateCaptchaCache();
    // Now reads fresh → turnstile + empty token → false
    expect(await verifyCaptcha('')).toBe(false);
  });
});
