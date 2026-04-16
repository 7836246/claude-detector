import {
  PROBES,
  aggregate,
  summarizeCategories,
  type ProbeContext,
  type ProbeResult,
  type Category,
} from './probes';
import { summarize, type AuditEntry, type AuditSummary } from './audit';
import { determineVerdict, type VerdictDetail } from './verdict';

export type RunnerEvent =
  | { type: 'start'; total: number }
  | { type: 'probe_start'; index: number; name: string; label: string }
  | { type: 'probe_result'; index: number; result: ProbeResult }
  | {
      type: 'done';
      results: ProbeResult[];
      score: number;
      verdict: 'genuine' | 'suspicious' | 'fake';
      verdictDetail: VerdictDetail;
      categories: Array<{
        category: Category;
        label: string;
        passed: boolean;
        score: number;
      }>;
      audit: AuditSummary;
    }
  | { type: 'error'; message: string };

export async function* runProbes(
  ctx: ProbeContext,
): AsyncGenerator<RunnerEvent> {
  // Filter probes: skip auditOnly probes when tokenAudit is off
  const activeProbes = ctx.tokenAudit
    ? PROBES
    : PROBES.filter((p) => !p.auditOnly);

  yield { type: 'start', total: activeProbes.length };

  const results: ProbeResult[] = [];
  const audits: AuditEntry[] = [];
  let totalLatencyMs = 0;
  let roundCounter = 0;

  for (let i = 0; i < activeProbes.length; i++) {
    const probe = activeProbes[i];
    yield {
      type: 'probe_start',
      index: i,
      name: probe.name,
      label: probe.label,
    };

    let result: ProbeResult;
    try {
      const out = await probe.run(ctx);
      result = {
        name: probe.name,
        label: probe.label,
        category: probe.category,
        weight: probe.weight,
        ...out,
      };
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      result = {
        name: probe.name,
        label: probe.label,
        category: probe.category,
        weight: probe.weight,
        passed: false,
        score: 0,
        detail: `exception: ${msg}`,
      };
    }

    if (result.latencyMs) {
      totalLatencyMs += result.latencyMs;
    }

    if (result.audit) {
      roundCounter++;
      const entry: AuditEntry = {
        ...result.audit,
        round: roundCounter,
        probeName: probe.name,
        probeLabel: probe.label,
      };
      audits.push(entry);
    }

    results.push(result);
    yield { type: 'probe_result', index: i, result };
  }

  const { score, verdict } = aggregate(results);
  const categories = summarizeCategories(results);
  const audit = summarize(audits, totalLatencyMs);
  const verdictDetail = determineVerdict(results, audit);

  yield { type: 'done', results, score, verdict, verdictDetail, categories, audit };
}
