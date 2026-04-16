// Thin wrapper over db.ts — keeps the same API for existing callers.
import { saveResult, loadResult, gcResults } from './db';

let gcCounter = 0;

export function save(id: string, data: any): void {
  const meta = {
    endpoint: data?.endpoint ?? '',
    model: data?.model ?? '',
    score: data?.score ?? 0,
    verdict: data?.verdict ?? '',
    tier: data?.verdictDetail?.result ?? data?.verdict ?? '',
  };
  saveResult(id, data, meta);

  // Lazy GC every 50 writes
  if (++gcCounter % 50 === 0) gcResults();
}

export function load(id: string): unknown | null {
  return loadResult(id);
}
