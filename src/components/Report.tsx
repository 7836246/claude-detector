import { useState } from 'react';
import { t as translate, type Locale } from '../lib/i18n';

// --- Data types ---

interface ProbeResult {
  name: string; label: string; category: string; weight: number;
  passed: boolean; score: number; detail: string; latencyMs?: number;
}

interface AuditEntry {
  round: number; billedInput: number; billedOutput: number;
  billedCacheCreate: number; billedCacheRead: number;
  honestInput: number | null; honestOutput: number | null;
  billedCost: number; honestCost: number; ratio: number;
}

interface AuditSummary {
  entries: AuditEntry[]; anomalies: Anomaly[];
  totalBilledCost: number; totalHonestCost: number;
  overallRatio: number; cacheHitRate: number; totalInputTokens: number;
  totalOutputTokens: number; totalLatencyMs: number; tokensPerSecond: number;
  anomalousRounds: number;
}

interface CategorySummary { category: string; label: string; passed: boolean; }

interface Anomaly {
  type: string; severity: string; message: string; round: number | null;
}

interface VerdictDetail {
  result: string; channel: string | null; label: string; description: string;
  marketPrice: string; confidence: number; signals: string[];
}

type Verdict = 'genuine' | 'suspicious' | 'fake';

export interface ReportData {
  score: number; verdict: Verdict; verdictDetail?: VerdictDetail | null;
  model: string; categories: CategorySummary[];
  audit: AuditSummary | null;
  probes: Array<{ index: number; name: string; label: string; result?: ProbeResult }>;
  resultId?: string;
}

interface Props { data: ReportData; locale?: Locale; onReset?: () => void; }

// --- Colors ---
const VC: Record<Verdict, { ring: string; label: string; border: string; bg: string }> = {
  genuine:    { ring: '#2d8a56', label: 'text-ok',   border: 'border-ok/20',   bg: 'bg-ok/5' },
  suspicious: { ring: '#d4860b', label: 'text-warn', border: 'border-warn/20', bg: 'bg-warn/5' },
  fake:       { ring: '#d94040', label: 'text-bad',  border: 'border-bad/20',  bg: 'bg-bad/5' },
};

// --- Main ---

export default function Report({ data, locale = 'zh', onReset }: Props) {
  const tt = (k: string) => translate(k, locale);
  const { score, verdict, verdictDetail, model, categories, audit, probes, resultId } = data;
  const [copied, setCopied] = useState(false);
  const vm = VC[verdict];

  function copyUrl() {
    if (!resultId) return;
    navigator.clipboard.writeText(`${window.location.origin}/result/${resultId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-dark-border bg-dark-bg p-6 text-[13px] text-dark-text">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-dark-muted">
        <span className="font-medium text-dark-text">
          {tt('report.title')} <span className="text-dark-muted">@anthropic.mom</span>
        </span>
        {resultId && <span className="font-mono text-[10px]">{resultId.slice(0, 8)}…</span>}
      </div>

      {/* Score + categories */}
      <div className="flex gap-6">
        <Ring score={score} color={vm.ring} />
        <div className="flex flex-1 flex-col justify-center space-y-1.5">
          {categories.map((c) => (
            <div key={c.category} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className={`text-xs ${c.passed ? 'text-ok' : 'text-bad'}`}>{c.passed ? '●' : '○'}</span>
                {tt(`cat.${c.category}`) !== `cat.${c.category}` ? tt(`cat.${c.category}`) : c.label}
              </span>
              <span className={`text-xs ${c.passed ? 'text-ok' : 'text-bad'}`}>
                {c.passed ? tt('cat.pass') : tt('cat.fail')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-dark-muted">{model}</p>

      {/* Stats */}
      {audit && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label={tt('stat.latency')} value={`${audit.totalLatencyMs.toLocaleString()}ms`} />
          <Stat label={tt('stat.tps')} value={audit.tokensPerSecond.toFixed(1)} />
          <Stat label={tt('stat.input')} value={audit.totalInputTokens.toLocaleString()} />
          <Stat label={tt('stat.output')} value={audit.totalOutputTokens.toLocaleString()} />
        </div>
      )}

      {/* Verdict: result + channel */}
      <div className={`rounded-xl border p-4 ${vm.border} ${vm.bg}`}>
        {verdictDetail ? (
          <>
            <p className={`font-semibold ${vm.label}`}>{verdictDetail.label}</p>
            <p className="mt-1 text-xs text-dark-muted">{verdictDetail.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
              {verdictDetail.channel && (
                <span className="rounded-md bg-dark-surface px-2 py-0.5 text-dark-text">
                  {verdictDetail.channel}
                </span>
              )}
              <span className="rounded-md bg-dark-surface px-2 py-0.5 text-dark-muted">
                {tt('tier.market_price')}: {verdictDetail.marketPrice}
              </span>
              <span className="rounded-md bg-dark-surface px-2 py-0.5 text-dark-muted">
                {tt('tier.confidence')}: {verdictDetail.confidence}%
              </span>
            </div>
            {verdictDetail.signals.length > 0 && (
              <details className="mt-2.5">
                <summary className="cursor-pointer text-xs text-dark-muted hover:text-dark-text">
                  {tt('tier.signals')} ({verdictDetail.signals.length})
                </summary>
                <ul className="mt-1.5 space-y-0.5 pl-4 text-xs text-dark-muted">
                  {verdictDetail.signals.map((s, i) => <li key={i} className="list-disc">{s}</li>)}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p className={`font-semibold ${vm.label}`}>{tt(`verdict.${verdict}`)}</p>
        )}
      </div>

      {/* Token audit */}
      {audit && audit.entries.length > 0 && (
        <div className="space-y-3 rounded-xl border border-dark-border bg-dark-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{tt('audit.title')}</h3>
            <span className="text-xs text-dark-muted">
              {tt('audit.ratio')} {audit.overallRatio.toFixed(2)}x · {audit.overallRatio <= 1.2 ? tt('audit.normal_range') : audit.overallRatio <= 1.5 ? tt('audit.high') : tt('audit.critical')}
            </span>
          </div>

          <p className="rounded-lg border border-warn/20 bg-warn/5 px-3 py-2 text-xs text-warn">
            {tt('audit.warning')}
          </p>

          <div className="grid grid-cols-4 gap-2">
            <Stat label={tt('audit.baseline')} value={`$${audit.totalHonestCost.toFixed(4)}`} />
            <Stat label={tt('audit.actual')} value={`$${audit.totalBilledCost.toFixed(4)}`} />
            <Stat label={tt('audit.ratio')} value={`${audit.overallRatio.toFixed(2)}x`} warn={audit.overallRatio > 1.15} />
            <Stat label={tt('audit.cache_hit')} value={`${Math.round(audit.cacheHitRate * 100)}%`} />
          </div>

          <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
            audit.anomalousRounds === 0 ? 'bg-ok/10 text-ok' : audit.anomalousRounds <= 3 ? 'bg-warn/10 text-warn' : 'bg-bad/10 text-bad'
          }`}>
            {audit.anomalousRounds === 0 ? tt('audit.normal') : `${audit.anomalousRounds} ${tt('audit.anomaly')}`}
          </span>

          {/* Anomaly list */}
          {audit.anomalies && audit.anomalies.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-dark-border bg-dark-bg/60 p-3">
              {audit.anomalies.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 shrink-0 ${
                    a.severity === 'critical' ? 'text-bad' : a.severity === 'warning' ? 'text-warn' : 'text-dark-muted'
                  }`}>
                    {a.severity === 'critical' ? '●' : a.severity === 'warning' ? '▲' : '○'}
                  </span>
                  <span className="text-dark-muted">
                    <span className="font-mono text-[10px] text-dark-muted/60">[{a.type}]</span>{' '}
                    {a.message}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <BarChart entries={audit.entries} locale={locale} />
          <Table entries={audit.entries} locale={locale} />
        </div>
      )}

      {/* Probe detail */}
      <details>
        <summary className="cursor-pointer text-xs text-dark-muted hover:text-dark-text">
          {tt('report.detail')} ({probes.length})
        </summary>
        <ul className="mt-2 space-y-1 rounded-lg border border-dark-border bg-dark-surface p-3">
          {probes.map((p) => (
            <li key={p.index} className="flex items-start gap-2 font-mono text-xs">
              <span className="mt-0.5 w-3.5 shrink-0 text-center">
                {p.result?.passed ? <span className="text-ok">✓</span> : <span className="text-bad">✗</span>}
              </span>
              <span className="min-w-28 shrink-0 text-dark-text">{p.label}</span>
              <span className="flex-1 truncate text-dark-muted">{p.result?.detail ?? ''}</span>
              {p.result?.latencyMs != null && <span className="shrink-0 text-dark-muted">{p.result.latencyMs}ms</span>}
            </li>
          ))}
        </ul>
      </details>

      {/* Actions */}
      <div className="flex gap-3">
        {resultId && (
          <button onClick={copyUrl}
            className="flex-1 rounded-xl border border-terra/30 bg-terra/5 px-4 py-2.5 text-sm font-medium text-terra transition hover:bg-terra/10">
            {copied ? tt('report.copied') : tt('report.share')}
          </button>
        )}
        {onReset && (
          <button onClick={onReset}
            className="flex-1 rounded-xl border border-dark-border bg-dark-surface px-4 py-2.5 text-sm font-medium text-dark-text transition hover:bg-dark-border/50">
            {tt('report.retry')}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function Ring({ score, color }: { score: number; color: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} fill="none" stroke="#3a3530" strokeWidth="6" />
        <circle cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute text-2xl font-bold text-white">{score}%</span>
    </div>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-dark-border bg-dark-bg/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-dark-muted">{label}</div>
      <div className={`mt-0.5 text-base font-bold ${warn ? 'text-warn' : 'text-dark-text'}`}>{value}</div>
    </div>
  );
}

function BarChart({ entries, locale }: { entries: AuditEntry[]; locale: Locale }) {
  const tt = (k: string) => translate(k, locale);
  const bw = 20, gap = 12, gw = bw * 2 + 3;
  const cw = entries.length * (gw + gap) - gap + 32;
  const ch = 100, lh = 36;
  const max = Math.max(...entries.map((e) => Math.max(e.honestCost, e.billedCost)), 0.001);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${cw} ${ch + lh}`} className="w-full min-w-[420px]">
        <rect x={cw - 115} y={3} width={6} height={6} rx={1.5} fill="#3a3530" />
        <text x={cw - 105} y={9.5} fill="#9b9490" fontSize="7">{tt('audit.baseline')}</text>
        <rect x={cw - 52} y={3} width={6} height={6} rx={1.5} fill="#2d8a56" />
        <text x={cw - 42} y={9.5} fill="#9b9490" fontSize="7">{tt('audit.actual')}</text>
        {entries.map((e, i) => {
          const x = 16 + i * (gw + gap);
          const hH = (e.honestCost / max) * (ch - 16);
          const bH = (e.billedCost / max) * (ch - 16);
          const anom = e.ratio > 1.15 || e.ratio < 0.85;
          const fill = anom ? (e.ratio > 1.5 ? '#d94040' : '#d4860b') : '#2d8a56';
          return (
            <g key={i}>
              <rect x={x} y={ch - hH} width={bw} height={hH} rx={2.5} fill="#3a3530" opacity={0.5} />
              <rect x={x + bw + 3} y={ch - bH} width={bw} height={bH} rx={2.5} fill={fill} />
              <text x={x + gw / 2} y={ch + 12} textAnchor="middle" fill="#9b9490" fontSize="8">R{e.round}</text>
              <text x={x + gw / 2} y={ch + 23} textAnchor="middle" fill={anom ? fill : '#2d8a56'} fontSize="8" fontWeight="bold">
                {e.ratio.toFixed(2)}x
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Table({ entries, locale }: { entries: AuditEntry[]; locale: Locale }) {
  const tt = (k: string) => translate(k, locale);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-dark-border text-[10px] uppercase tracking-wider text-dark-muted">
            <th className="px-2 py-1.5">{tt('table.round')}</th>
            <th className="px-2 py-1.5">{tt('table.input')}</th>
            <th className="px-2 py-1.5">{tt('table.output')}</th>
            <th className="px-2 py-1.5">{tt('table.cache_create')}</th>
            <th className="px-2 py-1.5">{tt('table.cache_read')}</th>
            <th className="px-2 py-1.5">{tt('table.cost')}</th>
            <th className="px-2 py-1.5">{tt('audit.ratio')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const a = e.ratio > 1.15 || e.ratio < 0.85;
            return (
              <tr key={e.round} className="border-b border-dark-border/50 text-dark-text">
                <td className="px-2 py-1.5 text-dark-muted">{e.round}</td>
                <td className="px-2 py-1.5">{e.billedInput}<Diff d={e.honestInput !== null ? e.billedInput - e.honestInput : 0} b={e.honestInput ?? 0} /></td>
                <td className="px-2 py-1.5">{e.billedOutput}<Diff d={e.honestOutput !== null ? e.billedOutput - e.honestOutput : 0} b={e.honestOutput ?? 0} /></td>
                <td className="px-2 py-1.5">{e.billedCacheCreate || '—'}</td>
                <td className="px-2 py-1.5">{e.billedCacheRead || '—'}</td>
                <td className="px-2 py-1.5 font-mono">${e.billedCost.toFixed(4)}</td>
                <td className={`px-2 py-1.5 font-mono font-bold ${a ? (e.ratio > 1.5 ? 'text-bad' : 'text-warn') : 'text-ok'}`}>
                  {e.ratio.toFixed(2)}x
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Diff({ d, b }: { d: number; b: number }) {
  if (d === 0 || b === 0) return null;
  const pct = Math.round((d / b) * 100);
  return <span className={`ml-1 text-[10px] ${d > 0 ? 'text-bad' : 'text-ok'}`}>({d > 0 ? '↑' : '↓'}{Math.abs(pct)}%)</span>;
}
