import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { createAdminToken, isAdminConfigured, COOKIE_NAME, COOKIE_MAX_AGE } from '../../../lib/auth';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) {
    // Still run compare against equal-length dummy to flatten timing
    timingSafeEqual(aBuf, Buffer.alloc(aBuf.length));
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminConfigured()) {
    return json({ error: 'Admin not configured' }, 503);
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? '';
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const expected = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD ?? '';
  if (!password || !constantTimeEquals(password, expected)) {
    return json({ error: 'Wrong password' }, 401);
  }

  cookies.set(COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return json({ ok: true });
};
