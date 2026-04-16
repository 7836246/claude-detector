// Multi-provider captcha verification.
// Supported: Cloudflare Turnstile, Tencent Cloud Captcha, hCaptcha, Google reCAPTCHA v3.
// Provider + keys configured via admin settings (SQLite config table).

import { getConfig } from './db';

export type CaptchaProvider = 'none' | 'turnstile' | 'tencent' | 'hcaptcha' | 'recaptcha';

export interface CaptchaConfig {
  provider: CaptchaProvider;
  siteKey: string;
  secretKey: string;
  tencentAppId?: string; // Tencent-specific
}

export const PROVIDER_LABELS: Record<CaptchaProvider, string> = {
  none: '关闭验证',
  turnstile: 'Cloudflare Turnstile',
  tencent: '腾讯云天御验证码',
  hcaptcha: 'hCaptcha',
  recaptcha: 'Google reCAPTCHA v3',
};

export const PROVIDER_DOCS: Record<CaptchaProvider, string> = {
  none: '',
  turnstile: 'https://dash.cloudflare.com/?to=/:account/turnstile',
  tencent: 'https://console.cloud.tencent.com/captcha',
  hcaptcha: 'https://dashboard.hcaptcha.com',
  recaptcha: 'https://www.google.com/recaptcha/admin',
};

// Client-side script URLs per provider
export const PROVIDER_SCRIPTS: Record<CaptchaProvider, string> = {
  none: '',
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
  tencent: 'https://turing.captcha.qcloud.com/TCaptcha.js',
  hcaptcha: 'https://js.hcaptcha.com/1/api.js',
  recaptcha: '', // loaded with siteKey as param
};

// Read config from SQLite (falls back to env vars for backwards compat)
export function getCaptchaConfig(): CaptchaConfig {
  const provider = (getConfig('captcha_provider') ??
    (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ? 'turnstile' : 'none')) as CaptchaProvider;

  if (provider === 'turnstile') {
    return {
      provider,
      siteKey: getConfig('captcha_site_key') ?? import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '',
      secretKey: getConfig('captcha_secret_key') ?? import.meta.env.TURNSTILE_SECRET_KEY ?? '',
    };
  }

  return {
    provider,
    siteKey: getConfig('captcha_site_key') ?? '',
    secretKey: getConfig('captcha_secret_key') ?? '',
    tencentAppId: getConfig('captcha_tencent_appid') ?? '',
  };
}

// Public config (safe to expose to client — no secret key)
export interface PublicCaptchaConfig {
  provider: CaptchaProvider;
  siteKey: string;
  scriptUrl: string;
  tencentAppId?: string;
}

export function getPublicCaptchaConfig(): PublicCaptchaConfig {
  const cfg = getCaptchaConfig();
  let scriptUrl = PROVIDER_SCRIPTS[cfg.provider] ?? '';
  if (cfg.provider === 'recaptcha' && cfg.siteKey) {
    scriptUrl = `https://www.google.com/recaptcha/api.js?render=${cfg.siteKey}`;
  }
  return {
    provider: cfg.provider,
    siteKey: cfg.siteKey,
    scriptUrl,
    tencentAppId: cfg.tencentAppId,
  };
}

// Server-side token verification
export async function verifyCaptcha(token: string, extra?: { ip?: string }): Promise<boolean> {
  const cfg = getCaptchaConfig();

  if (cfg.provider === 'none') return true;
  if (!token || !cfg.secretKey) return false;

  switch (cfg.provider) {
    case 'turnstile':
      return verifyTurnstile(token, cfg.secretKey, extra?.ip);
    case 'tencent':
      return verifyTencent(token, cfg);
    case 'hcaptcha':
      return verifyHcaptcha(token, cfg.secretKey, extra?.ip);
    case 'recaptcha':
      return verifyRecaptcha(token, cfg.secretKey, extra?.ip);
    default:
      return false;
  }
}

// --- Provider-specific verification ---

async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<boolean> {
  try {
    const body: Record<string, string> = { secret, response: token };
    if (ip) body.remoteip = ip;
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

async function verifyTencent(token: string, cfg: CaptchaConfig): Promise<boolean> {
  // Tencent token format: "ticket:randstr"
  const [ticket, randstr] = token.split(':');
  if (!ticket || !randstr || !cfg.tencentAppId) return false;
  try {
    const params = new URLSearchParams({
      aid: cfg.tencentAppId,
      AppSecretKey: cfg.secretKey,
      Ticket: ticket,
      Randstr: randstr,
    });
    const res = await fetch(`https://ssl.captcha.qq.com/ticket/verify?${params}`);
    const data = (await res.json()) as { response?: string };
    return data.response === '1';
  } catch {
    return false;
  }
}

async function verifyHcaptcha(token: string, secret: string, ip?: string): Promise<boolean> {
  try {
    const body: Record<string, string> = { secret, response: token };
    if (ip) body.remoteip = ip;
    const res = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

async function verifyRecaptcha(token: string, secret: string, ip?: string): Promise<boolean> {
  try {
    const body: Record<string, string> = { secret, response: token };
    if (ip) body.remoteip = ip;
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });
    const data = (await res.json()) as { success?: boolean; score?: number };
    return !!data.success && (data.score ?? 0) >= 0.5;
  } catch {
    return false;
  }
}
