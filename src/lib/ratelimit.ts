// Thin wrapper over db.ts — keeps the same API for existing callers.
import { checkRate } from './db';

export function checkRateLimit(ip: string): {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  return checkRate(ip);
}
