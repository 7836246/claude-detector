import type { APIRoute } from 'astro';
import { PROBES } from '../../lib/probes';

export const prerender = false;

const startedAt = Date.now();

export const GET: APIRoute = async () => {
  let dbOk = false;
  try {
    const { getConfig } = await import('../../lib/db');
    getConfig('_health_check');
    dbOk = true;
  } catch {}

  const uptimeMs = Date.now() - startedAt;
  const status = dbOk ? 'ok' : 'degraded';

  return new Response(
    JSON.stringify({
      status,
      uptime: `${Math.floor(uptimeMs / 1000)}s`,
      db: dbOk ? 'connected' : 'error',
      probeCount: PROBES.length,
      version: '0.1.0',
    }),
    {
      status: dbOk ? 200 : 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
    },
  );
};
