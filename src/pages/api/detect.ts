import type { APIRoute } from 'astro';
import { runProbes } from '../../lib/runner';
import { checkRateLimit } from '../../lib/ratelimit';
import { save } from '../../lib/store';
import { t, detectLocale, type Locale } from '../../lib/i18n';
import { verifyCaptcha } from '../../lib/captcha';
import { checkEndpoint } from '../../lib/ssrf';
import { extractClientIp, sanitizeEndpointForStorage } from '../../lib/request';

export const prerender = false;

interface DetectBody {
  endpoint?: unknown;
  apiKey?: unknown;
  model?: unknown;
  turnstileToken?: unknown;
  tokenAudit?: unknown;
}

type ValidatedBody = { endpoint: string; apiKey: string; model: string };

async function validate(
  body: DetectBody,
  locale: Locale,
): Promise<ValidatedBody | string> {
  const { endpoint, apiKey, model } = body;
  if (typeof endpoint !== 'string' || !endpoint)
    return t('error.endpoint_required', locale);
  if (!/^https?:\/\//i.test(endpoint))
    return t('error.endpoint_invalid', locale);
  if (endpoint.length > 256) return t('error.endpoint_too_long', locale);
  if (typeof apiKey !== 'string' || !apiKey)
    return t('error.apikey_required', locale);
  if (apiKey.length < 8 || apiKey.length > 256)
    return t('error.apikey_invalid', locale);
  if (typeof model !== 'string' || !model)
    return t('error.model_required', locale);
  if (model.length > 128) return t('error.model_too_long', locale);

  const check = await checkEndpoint(endpoint);
  if (!check.ok) {
    switch (check.reason) {
      case 'scheme':
        return t('error.endpoint_invalid', locale);
      case 'userinfo':
        return t('error.endpoint_userinfo', locale);
      case 'hostname':
        return t('error.endpoint_invalid', locale);
      case 'dns':
        return t('error.endpoint_dns', locale);
      case 'private':
        return t('error.endpoint_private', locale);
    }
  }
  return { endpoint: check.url, apiKey, model };
}

function jsonError(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const locale = detectLocale(request.headers.get('accept-language'));

  const ip = extractClientIp(request.headers, clientAddress);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    const secs = Math.ceil(rl.retryAfterMs / 1000);
    return jsonError(
      `${t('error.rate_limit', locale)} (${secs}s)`,
      429,
    );
  }

  let body: DetectBody;
  try {
    body = (await request.json()) as DetectBody;
  } catch {
    return jsonError(t('error.invalid_json', locale), 400);
  }

  const captchaOk = await verifyCaptcha(String(body.turnstileToken ?? ''), { ip });
  if (!captchaOk) {
    return jsonError(t('error.turnstile', locale), 403);
  }

  const parsed = await validate(body, locale);
  if (typeof parsed === 'string') {
    return jsonError(parsed, 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };
      try {
        const tokenAudit = !!body.tokenAudit;
        for await (const ev of runProbes({
          ...parsed,
          tokenAudit,
          signal: request.signal,
        })) {
          if (ev.type === 'done') {
            const resultId = crypto.randomUUID();
            save(resultId, {
              ...ev,
              model: parsed.model,
              endpoint: sanitizeEndpointForStorage(parsed.endpoint),
              createdAt: Date.now(),
            });
            send({ ...ev, resultId });
          } else {
            send(ev);
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          // client disconnect — don't emit
        } else {
          console.error('[detect] probe failure', e);
          send({ type: 'error', message: t('error.probe_failed', locale) });
        }
      } finally {
        controller.close();
      }
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'x-ratelimit-remaining': String(rl.remaining),
    },
  });
};
