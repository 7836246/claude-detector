import type { APIRoute } from 'astro';
import { load } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id || typeof id !== 'string' || id.length > 64) {
    return new Response(JSON.stringify({ error: 'invalid id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = load(id);
  if (!data) {
    return new Response(JSON.stringify({ error: 'not found or expired' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  });
};
