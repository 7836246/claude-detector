import { createHash, timingSafeEqual } from 'node:crypto';

const SALT = '__cctest_admin_v1__';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + SALT).digest('hex');
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD ?? '';
}

export function createAdminToken(): string {
  const pw = getAdminPassword();
  if (!pw) return '';
  return hashPassword(pw);
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = createAdminToken();
  if (!expected) return false;
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function isAdminConfigured(): boolean {
  return !!getAdminPassword();
}

export const COOKIE_NAME = 'admin_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours
