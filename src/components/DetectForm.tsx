import { useMemo, useRef, useState } from 'react';
import Report, { type ReportData } from './Report';
import CaptchaWidget from './CaptchaWidget';
import Select from './Select';
import { useLocale, useT } from '../hooks/useLocale';

const MODELS = [
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', est: '$0.30' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', est: '$0.08' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', est: '$0.02' },
];

type Stage = 'idle' | 'running' | 'done';

interface LiveProbe {
  index: number;
  name: string;
  label: string;
  status: 'pending' | 'running' | 'done';
  result?: any;
}

export default function DetectForm() {
  const locale = useLocale();
  const tt = useT();

  const [endpoint, setEndpoint] = useState('https://api.anthropic.com');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [tokenAudit, setTokenAudit] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [probes, setProbes] = useState<LiveProbe[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const est = useMemo(() => MODELS.find((m) => m.id === model)?.est ?? '—', [model]);
  const total = probes.length || 19;
  const completed = probes.filter((p) => p.status === 'done').length;
  const progress = stage === 'running' ? (completed / total) * 100 : 0;

  function handleEvent(ev: any) {
    switch (ev.type) {
      case 'start':
        setProbes(Array.from({ length: ev.total }, (_, i) => ({
          index: i, name: '', label: '…', status: 'pending' as const,
        })));
        return;
      case 'probe_start':
        setProbes((prev) => {
          const next = [...prev];
          next[ev.index] = { index: ev.index, name: ev.name, label: ev.label, status: 'running' };
          return next;
        });
        return;
      case 'probe_result':
        setProbes((prev) => {
          const next = [...prev];
          next[ev.index] = { index: ev.index, name: ev.result.name, label: ev.result.label, status: 'done', result: ev.result };
          return next;
        });
        return;
      case 'done':
        setReportData({
          score: ev.score, verdict: ev.verdict, verdictDetail: ev.verdictDetail ?? null,
          model, categories: ev.categories ?? [], audit: ev.audit ?? null,
          probes: probes.map((p, i) => ({ index: i, name: ev.results?.[i]?.name ?? p.name, label: ev.results?.[i]?.label ?? p.label, result: ev.results?.[i] })),
          resultId: ev.resultId,
        });
        return;
      case 'error':
        setError(ev.message);
        return;
    }
  }

  async function runDetection() {
    setStage('running');
    setProbes([]);
    setReportData(null);
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint, apiKey, model, turnstileToken, tokenAudit }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setError(`HTTP ${res.status} ${await res.text().catch(() => '')}`);
        setStage('done');
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const line = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          try { handleEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') setError(e instanceof Error ? e.message : String(e));
    } finally {
      abortRef.current = null;
      setStage('done');
    }
  }

  function reset() {
    setStage('idle');
    setProbes([]);
    setReportData(null);
    setError(null);
    setTurnstileToken('');
  }

  return (
    <div className="space-y-6">
      {/* Form card */}
      <form
        onSubmit={(e) => { e.preventDefault(); void runDetection(); }}
        className="space-y-4 rounded-2xl border border-sand bg-white p-6"
      >
        <Field label={tt('form.endpoint')} id="ep">
          <input id="ep" type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.anthropic.com" disabled={stage === 'running'}
            className={inputCls} required />
        </Field>

        <Field label={tt('form.apikey')} id="ak">
          <input id="ak" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..." disabled={stage === 'running'}
            className={`${inputCls} font-mono`} required autoComplete="off" spellCheck={false} />
          <p className="mt-1 text-xs text-ink-tertiary">
            🔒 {tt('form.key_safe')}
          </p>
        </Field>

        <Field label={tt('form.model')} id="md">
          <Select
            id="md"
            options={MODELS.map((m) => ({ value: m.id, label: m.name }))}
            value={model}
            onChange={setModel}
            disabled={stage === 'running'}
          />
        </Field>

        {/* Token audit toggle */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-sand bg-white px-4 py-3 transition-colors hover:border-sand-dark">
          <div>
            <div className="text-[13px] font-medium text-ink">{tt('form.token_audit')}</div>
            <div className="mt-0.5 text-xs text-ink-tertiary">{tt('form.token_audit_desc')}</div>
          </div>
          <div className="relative ml-4 shrink-0">
            <input
              type="checkbox"
              checked={tokenAudit}
              onChange={(e) => setTokenAudit(e.target.checked)}
              disabled={stage === 'running'}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-sand transition-colors peer-checked:bg-terra peer-disabled:opacity-50" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </div>
        </label>

        <div className="flex items-center justify-between rounded-lg bg-cream-dark px-4 py-2.5 text-xs text-ink-secondary">
          <span>{tokenAudit ? tt('form.rounds_audit') : tt('form.rounds')}</span>
          <span>{tt('form.est')} <strong className="text-ink">{tokenAudit ? est : '~$0.01'}</strong></span>
        </div>

        {stage === 'idle' && (
          <CaptchaWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken('')} />
        )}

        {/* Progress */}
        {stage === 'running' && (
          <div className="space-y-3">
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-terra transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-center text-xs text-ink-tertiary">
                {tt('form.progress')} {completed} / {total} {tt('form.of')}
              </p>
            </div>
            <ProbeList probes={probes} />
          </div>
        )}

        {/* Error */}
        {stage === 'done' && error && !reportData && (
          <div className="rounded-lg border border-bad/20 bg-bad-light p-4 text-sm text-bad">
            <p className="font-semibold">{tt('report.failed')}</p>
            <p className="mt-1 font-mono text-xs break-all opacity-80">{error}</p>
            <button type="button" onClick={reset} className="mt-2 text-xs font-medium underline underline-offset-2">
              {tt('report.retry')}
            </button>
          </div>
        )}

        {/* Buttons */}
        {stage === 'idle' && (
          <button type="submit" disabled={!apiKey}
            className="w-full rounded-xl bg-terra px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-terra-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
            {tt('form.submit')}
          </button>
        )}
        {stage === 'running' && (
          <button type="button" onClick={() => abortRef.current?.abort()}
            className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-cream-dark">
            {tt('form.cancel')}
          </button>
        )}
      </form>

      {/* Report */}
      {stage === 'done' && reportData && (
        <Report data={reportData} locale={locale} onReset={reset} />
      )}
    </div>
  );
}

// --- Shared ---

const inputCls =
  'w-full rounded-lg border border-sand bg-white px-3.5 py-2.5 text-sm text-ink transition placeholder:text-ink-tertiary focus:border-terra focus:outline-none focus:ring-2 focus:ring-terra/10 disabled:bg-cream-dark disabled:text-ink-tertiary';

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}

function ProbeList({ probes }: { probes: LiveProbe[] }) {
  return (
    <ul className="space-y-1 rounded-lg border border-sand bg-cream-dark/50 p-3">
      {probes.map((p) => (
        <li key={p.index} className="flex items-start gap-2 font-mono text-xs">
          <span className="mt-0.5 w-3.5 shrink-0 text-center">
            {p.status === 'pending' && <span className="text-sand-dark">·</span>}
            {p.status === 'running' && <span className="inline-block animate-spin text-terra">◐</span>}
            {p.status === 'done' && p.result?.passed && <span className="text-ok">✓</span>}
            {p.status === 'done' && p.result && !p.result.passed && <span className="text-bad">✗</span>}
          </span>
          <span className="min-w-28 shrink-0 text-ink-secondary">{p.label}</span>
          <span className="flex-1 truncate text-ink-tertiary">
            {p.result?.detail ?? (p.status === 'running' ? '…' : '')}
          </span>
          {p.result?.latencyMs != null && (
            <span className="shrink-0 text-ink-tertiary">{p.result.latencyMs}ms</span>
          )}
        </li>
      ))}
    </ul>
  );
}
