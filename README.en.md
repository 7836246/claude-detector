# Anthropic 妈妈测试 (anthropic.mom)

Black-box verification platform for Claude API keys. Detects proxy fraud, model downgrades, token inflation, and reverse-engineered endpoints through 19 automated probes.

## Features

- **13 Black-Box Probes** — connectivity, model echo, response schema, token accounting, system prompt adherence, stop sequences, max_tokens, tool use (reverse detection), SSE streaming, error format, self-identification, reasoning fingerprint, multimodal
- **7-Tier Verdict System** — Official Console API / Official Max / Clean Proxy / Inflated Proxy / Reverse-Engineered / Non-Claude / Unknown
- **Token Usage Audit** — Independent recount via `count_tokens` endpoint, per-round cost comparison with official pricing baseline, anomaly detection
- **Real-Time SSE Streaming** — Live probe-by-probe progress with results
- **Result Sharing** — Unique URL for each detection report, 1-hour TTL
- **Multi-Captcha** — Cloudflare Turnstile, Tencent Cloud Captcha, hCaptcha, Google reCAPTCHA v3, configurable from admin panel
- **Admin Dashboard** — Detection stats, verdict distribution, top endpoints, recent results table, captcha settings
- **i18n** — Chinese, English, Japanese, Korean
- **Rate Limiting** — 5 requests/minute per IP, SQLite-backed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 (App Router, server + prerendered hybrid) |
| UI Islands | React 19 |
| Styling | Tailwind CSS 4 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Runtime | Node.js 22+ |
| Deployment | Docker (multi-stage build) |

## Quick Start

```bash
# Clone
git clone https://github.com/7836246/claude-detector.git
cd cctest

# Install
npm install

# Configure (optional — works with defaults for development)
cp .env.example .env

# Run
npm run dev
# Open http://localhost:4321
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | Yes (production) | `admin123` | Admin panel password |
| `PUBLIC_TURNSTILE_SITE_KEY` | No | Test key | Fallback Turnstile site key (overridden by admin settings) |
| `TURNSTILE_SECRET_KEY` | No | Test key | Fallback Turnstile secret (overridden by admin settings) |
| `DATA_DIR` | No | `./data` | SQLite database directory |

Captcha provider and keys are managed through the admin panel at `/admin/settings` and stored in SQLite. Environment variables serve as fallback for initial setup.

## Docker Deployment

```bash
# Build and run
docker compose up -d

# Or manually
docker build -t cctest .
docker run -d \
  -p 4321:4321 \
  -v cctest-data:/data \
  -e ADMIN_PASSWORD=your_strong_password \
  cctest
```

The SQLite database is stored in `/data` inside the container. Mount a volume to persist data across restarts.

## Architecture

```
src/
  lib/
    anthropic.ts       Fetch wrapper for /v1/messages + /v1/messages/count_tokens
    probes.ts          19 probe definitions with category mapping
    runner.ts          Async generator — runs probes sequentially, emits SSE events
    verdict.ts         Decision tree: probe results + audit → 6-verdict + channel classification
    audit.ts           Token usage audit: honest vs billed cost aggregation
    pricing.ts         Official Claude model pricing table
    captcha.ts         Multi-provider captcha abstraction (4 providers)
    db.ts              SQLite schema + prepared statements
    store.ts           Result persistence (thin wrapper over db)
    ratelimit.ts       Sliding window rate limiter (thin wrapper over db)
    auth.ts            Admin cookie auth (SHA-256 HMAC)
    i18n.ts            Translation dictionary (80+ keys, 4 locales)
    i18n-dom.ts        Client-side DOM translation for Astro pages

  components/
    DetectForm.tsx     Main form + SSE consumer + progress display
    Report.tsx         Dark-theme report panel (score ring, categories, audit chart/table)
    CaptchaWidget.tsx  Dynamic multi-provider captcha widget
    Select.tsx         Custom dropdown component
    LocaleSwitch.tsx   Language selector
    Header.astro       Site header with nav
    Footer.astro       Site footer

  pages/
    index.astro        Landing page + detection form
    faq.astro          FAQ (6 items, 4 languages)
    contact.astro      Contact information
    result/[id].astro  Shared result page
    admin/
      index.astro      Dashboard (stats, recent results)
      login.astro      Admin login
      settings.astro   Captcha provider configuration
    api/
      detect.ts        POST — SSE detection endpoint
      captcha-config.ts GET — public captcha config
      result/[id].ts   GET — load saved result
      health.ts        GET — health check
      admin/
        login.ts       POST — admin auth
        settings.ts    GET/POST — captcha settings CRUD
```

## Detection Probes

| # | Probe | Category | Weight | What It Checks |
|---|-------|----------|--------|----------------|
| 1 | `connectivity` | Structural | 3 | HTTP 200 + valid response shape |
| 2 | `model_echo` | Signature | 3 | `response.model` matches request |
| 3 | `response_shape` | Structural | 2 | 8 required fields (id, type, role, model, content, stop_reason, usage.*) |
| 4 | `count_tokens_match` | Token Audit | 3 | `count_tokens` vs `usage.input_tokens` delta (audit-only) |
| 5 | `system_adherence` | Behavior | 1 | Strict system prompt compliance |
| 6 | `stop_sequence` | Behavior | 2 | `stop_reason=stop_sequence` + correct sequence |
| 7 | `max_tokens` | Behavior | 2 | `stop_reason=max_tokens` + output within limit |
| 8 | `tool_use` | Behavior | 3 | Tool call format, `toolu_*` ID, `stop_reason=tool_use` |
| 9 | `streaming_shape` | Structural | 2 | 6 required SSE events in correct order |
| 10 | `error_shape` | Signature Auth | 1 | Error object matches `{type:"error", error:{type, message}}` |
| 11 | `self_identification` | LLM Fingerprint | 1 | Response mentions "Claude" or "Anthropic" |
| 12 | `reasoning_fingerprint` | LLM Fingerprint | 2 | Correct answer to syllogistic reasoning |
| 13 | `multimodal` | Multimodal | 1 | Image input processing (1x1 red PNG) |

## Verdict Tiers

| Tier | Condition | Market Price |
|------|-----------|-------------|
| `official_console` | All pass + ratio ≤ 1.05 | Official pricing |
| `official_max` | All pass + ratio ≤ 1.15 | ~$200/mo |
| `proxy_clean` | Most pass + ratio OK | 2-3 RMB/USD |
| `proxy_inflated` | Most pass + ratio > 1.15 | Higher than labeled |
| `reverse` | tool_use/streaming/count_tokens fail (≥2) | 0.5-1.5 RMB/USD |
| `non_claude` | model_echo + self_id both fail | N/A |
| `unknown` | Connectivity fails | N/A |

## Development

```bash
npm run dev          # Start dev server (http://localhost:4321)
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run check        # TypeScript check
```

## Admin Panel

Access at `/admin` (password from `ADMIN_PASSWORD` env var).

- **Dashboard** — total/today detections, verdict distribution, top endpoints, recent results
- **Settings** — switch captcha providers, configure keys

## API

### `POST /api/detect`

Start a detection. Returns an SSE stream.

```json
{
  "endpoint": "https://api.anthropic.com",
  "apiKey": "sk-ant-...",
  "model": "claude-opus-4-6",
  "tokenAudit": true,
  "turnstileToken": "..."
}
```

SSE events: `start` → `probe_start` / `probe_result` (×13) → `done`

### `GET /api/result/:id`

Load a saved detection result by ID.

### `GET /api/health`

Health check. Returns `{ status, uptime, db, probeCount }`.

## License

MIT
