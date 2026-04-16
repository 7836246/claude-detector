import type { APIRoute } from 'astro';
import { verifyAdminToken, COOKIE_NAME } from '../../../lib/auth';
import { getConfig, setConfig } from '../../../lib/db';
import { type CaptchaProvider, PROVIDER_LABELS } from '../../../lib/captcha';

export const prerender = false;

const VALID_PROVIDERS = Object.keys(PROVIDER_LABELS) as CaptchaProvider[];

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!verifyAdminToken(cookies.get(COOKIE_NAME)?.value)) {
    return jsonRes({ error: 'unauthorized' }, 401);
  }
  return jsonRes({
    captcha_provider: getConfig('captcha_provider') ?? 'turnstile',
    captcha_site_key: getConfig('captcha_site_key') ?? '',
    captcha_secret_key: getConfig('captcha_secret_key') ?? '',
    captcha_tencent_appid: getConfig('captcha_tencent_appid') ?? '',
  });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!verifyAdminToken(cookies.get(COOKIE_NAME)?.value)) {
    return jsonRes({ error: 'unauthorized' }, 401);
  }

  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return jsonRes({ error: 'invalid json' }, 400);
  }

  const provider = body.captcha_provider;
  if (provider && !VALID_PROVIDERS.includes(provider as CaptchaProvider)) {
    return jsonRes({ error: `invalid provider: ${provider}` }, 400);
  }

  const allowed = ['captcha_provider', 'captcha_site_key', 'captcha_secret_key', 'captcha_tencent_appid'];
  for (const key of allowed) {
    if (key in body) {
      setConfig(key, String(body[key]));
    }
  }

  return jsonRes({ ok: true });
};
