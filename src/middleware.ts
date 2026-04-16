import { defineMiddleware } from 'astro:middleware';
import './lib/http-agent';

const COMMON_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const HSTS = 'max-age=31536000; includeSubDomains';

const CSP = [
  "default-src 'self'",
  // Astro + React islands ship small inline bootstrap scripts
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.hcaptcha.com https://www.google.com https://www.gstatic.com https://turing.captcha.qcloud.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com https://api.hcaptcha.com https://www.google.com https://ssl.captcha.qq.com",
  "frame-src https://challenges.cloudflare.com https://www.google.com https://newassets.hcaptcha.com https://turing.captcha.qcloud.com",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

export const onRequest = defineMiddleware(async (ctx, next) => {
  const response = await next();

  for (const [k, v] of Object.entries(COMMON_HEADERS)) {
    if (!response.headers.has(k)) response.headers.set(k, v);
  }

  if (ctx.url.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', HSTS);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.startsWith('text/html')) {
    response.headers.set('Content-Security-Policy', CSP);
  }

  return response;
});
