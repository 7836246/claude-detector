import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? import.meta.env.DATA_DIR ?? './data';

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(join(DATA_DIR, 'cctest.db'));
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// --- Migrations --------------------------------------------------------------
//
// `schema_version.version` records the highest migration applied. Push new
// migrations to the array; each runs exactly once in ascending order inside
// a transaction. Never edit or reorder existing entries.

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );
`);

const MIGRATIONS: ReadonlyArray<{ version: number; up: string }> = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS results (
        id          TEXT PRIMARY KEY,
        data        TEXT NOT NULL,
        endpoint    TEXT,
        model       TEXT,
        score       INTEGER,
        verdict     TEXT,
        tier        TEXT,
        created_at  INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS rate_limits (
        ip TEXT NOT NULL,
        ts INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_results_created ON results(created_at);
      CREATE INDEX IF NOT EXISTS idx_results_tier ON results(tier);
      CREATE INDEX IF NOT EXISTS idx_results_endpoint ON results(endpoint);
      CREATE INDEX IF NOT EXISTS idx_rate_ip_ts ON rate_limits(ip, ts);
    `,
  },
];

function runMigrations() {
  const row = db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM schema_version').get() as { v: number };
  const current = row.v;
  const pending = MIGRATIONS.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  if (pending.length === 0) return;
  const apply = db.transaction(() => {
    for (const m of pending) {
      db.exec(m.up);
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(m.version);
    }
  });
  apply();
}

runMigrations();

// Prepared statements
const insertResult = db.prepare(`
  INSERT INTO results (id, data, endpoint, model, score, verdict, tier, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const getResult = db.prepare(`SELECT data FROM results WHERE id = ?`);

const deleteExpired = db.prepare(`DELETE FROM results WHERE created_at < ?`);

const insertRate = db.prepare(`INSERT INTO rate_limits (ip, ts) VALUES (?, ?)`);
const deleteOldRates = db.prepare(`DELETE FROM rate_limits WHERE ts < ?`);
const countRates = db.prepare(`SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ?`);

// Admin queries
const countAll = db.prepare(`SELECT COUNT(*) as cnt FROM results`);
const countToday = db.prepare(`SELECT COUNT(*) as cnt FROM results WHERE created_at > ?`);
const countDistinctEndpoints = db.prepare(`SELECT COUNT(DISTINCT endpoint) as cnt FROM results`);
const verdictDist = db.prepare(`SELECT tier, COUNT(*) as cnt FROM results GROUP BY tier ORDER BY cnt DESC`);
const topEndpoints = db.prepare(`SELECT endpoint, COUNT(*) as cnt FROM results GROUP BY endpoint ORDER BY cnt DESC LIMIT 20`);
const recentResults = db.prepare(`SELECT id, endpoint, model, score, verdict, tier, created_at FROM results ORDER BY created_at DESC LIMIT ?`);

// -- Public API --

export function saveResult(
  id: string,
  data: unknown,
  meta: { endpoint: string; model: string; score: number; verdict: string; tier: string },
): void {
  insertResult.run(
    id,
    JSON.stringify(data),
    meta.endpoint,
    meta.model,
    meta.score,
    meta.verdict,
    meta.tier,
    Date.now(),
  );
}

export function loadResult(id: string): unknown | null {
  const row = getResult.get(id) as { data: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export function gcResults(ttlMs: number = 3600_000): void {
  deleteExpired.run(Date.now() - ttlMs);
}

// Rate limiting
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const GC_EVERY_N = 100;

let rateCounter = 0;

const checkRateTx = db.transaction((ip: string, now: number) => {
  const cutoff = now - WINDOW_MS;
  if (rateCounter++ % GC_EVERY_N === 0) {
    deleteOldRates.run(cutoff);
  }
  const { cnt } = countRates.get(ip, cutoff) as { cnt: number };
  if (cnt >= MAX_REQUESTS) {
    return { ok: false as const, remaining: 0, retryAfterMs: WINDOW_MS };
  }
  insertRate.run(ip, now);
  return { ok: true as const, remaining: MAX_REQUESTS - cnt - 1, retryAfterMs: 0 };
});

export function checkRate(ip: string): { ok: boolean; remaining: number; retryAfterMs: number } {
  return checkRateTx(ip, Date.now());
}

// Admin stats
export interface AdminStats {
  totalDetections: number;
  todayDetections: number;
  distinctEndpoints: number;
  verdictDistribution: Array<{ tier: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export function getAdminStats(): AdminStats {
  // Use UTC+8 (China) for "today" boundary
  const now = new Date();
  const utc8Offset = 8 * 60 * 60 * 1000;
  const utc8Now = new Date(now.getTime() + utc8Offset);
  const todayStart = new Date(
    Date.UTC(utc8Now.getUTCFullYear(), utc8Now.getUTCMonth(), utc8Now.getUTCDate()),
  );
  const todayStartMs = todayStart.getTime() - utc8Offset;

  const total = (countAll.get() as { cnt: number }).cnt;
  const today = (countToday.get(todayStartMs) as { cnt: number }).cnt;
  const distinct = (countDistinctEndpoints.get() as { cnt: number }).cnt;
  const dist = (verdictDist.all() as Array<{ tier: string; cnt: number }>).map((r) => ({
    tier: r.tier ?? 'unknown',
    count: r.cnt,
  }));
  const endpoints = (topEndpoints.all() as Array<{ endpoint: string; cnt: number }>).map((r) => ({
    endpoint: r.endpoint ?? '—',
    count: r.cnt,
  }));

  return {
    totalDetections: total,
    todayDetections: today,
    distinctEndpoints: distinct,
    verdictDistribution: dist,
    topEndpoints: endpoints,
  };
}

export interface ResultRow {
  id: string;
  endpoint: string;
  model: string;
  score: number;
  verdict: string;
  tier: string;
  createdAt: number;
}

export function getRecentResults(limit: number = 50): ResultRow[] {
  return (recentResults.all(limit) as Array<{
    id: string; endpoint: string; model: string; score: number;
    verdict: string; tier: string; created_at: number;
  }>).map((r) => ({
    id: r.id,
    endpoint: r.endpoint ?? '—',
    model: r.model ?? '—',
    score: r.score ?? 0,
    verdict: r.verdict ?? '—',
    tier: r.tier ?? 'unknown',
    createdAt: r.created_at,
  }));
}

// -- Site config (key-value) --

const getConfigStmt = db.prepare('SELECT value FROM config WHERE key = ?');
const setConfigStmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
const getAllConfigStmt = db.prepare('SELECT key, value FROM config');

export function getConfig(key: string): string | null {
  const row = getConfigStmt.get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setConfig(key: string, value: string): void {
  setConfigStmt.run(key, value);
}

export function getAllConfig(): Record<string, string> {
  const rows = getAllConfigStmt.all() as Array<{ key: string; value: string }>;
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return result;
}
