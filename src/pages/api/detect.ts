import type { APIRoute } from 'astro';
import { runProbes } from '../../lib/runner';
import { checkRateLimit } from '../../lib/ratelimit';
import { save } from '../../lib/store';
import { t, detectLocale, type Locale } from '../../lib/i18n';
import { verifyCaptcha } from '../../lib/captcha';

export const prerender = false;

interface DetectBody {
  endpoint?: unknown;
  apiKey?: unknown;
  model?: unknown;
  turnstileToken?: unknown;
  tokenAudit?: unknown;
}

function validate(
  body: DetectBody,
  locale: Locale,
): { endpoint: string; apiKey: string; model: string } | string {
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
  return { endpoint, apiKey, model };
}

function jsonError(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const locale = detectLocale(request.headers.get('accept-language'));

  // Rate limit
  const ip = clientAddress ?? '127.0.0.1';
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    const secs = Math.ceil(rl.retryAfterMs / 1000);
    return jsonError(
      `${t('error.rate_limit', locale)} (${secs}s)`,
      429,
    );
  }

  // Parse body
  let body: DetectBody;
  try {
    body = (await request.json()) as DetectBody;
  } catch {
    return jsonError(t('error.invalid_json', locale), 400);
  }

  // Captcha (provider determined by admin config)
  const captchaOk = await verifyCaptcha(String(body.turnstileToken ?? ''), { ip });
  if (!captchaOk) {
    return jsonError(t('error.turnstile', locale), 403);
  }

  // Validate
  const parsed = validate(body, locale);
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
        for await (const ev of runProbes({ ...parsed, tokenAudit })) {
          if (ev.type === 'done') {
            const resultId = crypto.randomUUID();
            save(resultId, {
              ...ev,
              model: parsed.model,
              endpoint: parsed.endpoint,
              createdAt: Date.now(),
            });
            send({ ...ev, resultId });
          } else {
            send(ev);
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ type: 'error', message: msg });
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
