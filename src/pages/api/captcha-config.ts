import type { APIRoute } from 'astro';
import { getPublicCaptchaConfig } from '../../lib/captcha';

export const prerender = false;

export const GET: APIRoute = async () => {
  const config = getPublicCaptchaConfig();
  return new Response(JSON.stringify(config), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=60',
    },
  });
};
