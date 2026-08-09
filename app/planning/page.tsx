'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Loader2, ArrowRight, Clock, UserRound, CheckCircle2 } from 'lucide-react';
import { firms } from '@/lib/firm/firms';
import { diagnoseFirm, buildDiagnosticBrief, Initiative } from '@/lib/firm/diagnostics';
import { LeverKey } from '@/lib/firm/benchmarks';
import { getScoreColor } from '@/lib/scoring';
import MetricCard from '@/components/ui/MetricCard';
import ScoreChip from '@/components/ui/ScoreChip';

const LEVER_COLORS: Record<LeverKey, string> = {
  pricing: '#3b82f6',
  serviceMix: '#22c55e',
  laborModel: '#a855f7',
  utilization: '#f59e0b',
  cashLockup: '#06b6d4',
  clientPortfolio: '#ef4444',
};

const EFFORT_STYLES: Record<Initiative['effort'], string> = {
  low: 'bg-green-500/15 text-green-400 border-green-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function fmtMetric(unit: string, value: number): string {
  switch (unit) {
    case '%':
      return `${value.toFixed(0)}%`;
    case '$':
      return `$${Math.round(value / 1000)}k`;
    case '$/hr':
      return `$${Math.round(value)}`;
    case 'days':
      return `${Math.round(value)}d`;
    case 'x':
      return `${value.toFixed(1)}x`;
    default:
      return `${value}`;
  }
}

export default function PlanningPage() {
  const [activeSlug, setActiveSlug] = useState(firms[0].slug);
  const [memo, setMemo] = useState('');
  const [memoLoading, setMemoLoading] = useState(false);

  const firm = firms.find((f) => f.slug === activeSlug)!;
  const diag = useMemo(() => diagnoseFirm(firm), [firm]);
  const bridgeMax = diag.potentialEbitda || 1;

  async function generateMemo() {
    if (memoLoading) return;
    setMemo('');
    setMemoLoading(true);
    const brief = buildDiagnosticBrief(firm, diag);
    const prompt =
      `Here is the diagnostic for one of our acquired accounting firms. Write a crisp value-creation memo ` +
      `for the operating partner: open with the headline opportunity, then walk the top 3 initiatives with the ` +
      `reasoning and the number, call out the single biggest risk, and end with the first move this quarter. ` +
      `Keep it tight and specific.\n\n${brief}`;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok || !res.body) throw new Error('API error');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMemo(full);
      }
    } catch {
      setMemo('Could not generate the memo. Check that ANTHROPIC_API_KEY is configured on the server, then try again.');
    } finally {
      setMemoLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Research &amp; Planning</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Diagnostic &amp; value-creation engine · benchmarked against platform standard · Q4 2024
        </p>
      </div>

      {/* Firm selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {firms.map((f) => {
          const d = diagnoseFirm(f);
          const active = f.slug === activeSlug;
          return (
            <button
              key={f.slug}
              onClick={() => setActiveSlug(f.slug)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                active ? 'border-blue-500/60 bg-blue-500/10' : 'border-slate-800 bg-[#161b27] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.accentColor }} />
                <span className="text-[13px] font-medium text-slate-200 truncate">{f.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <ScoreChip score={d.overallScore} />
                <span className="text-[13px] font-mono font-semibold text-green-400">+${d.totalEbitdaUplift.toFixed(1)}M</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Benchmark Score"
          value={diag.overallScore.toFixed(1)}
          sub="out of 5.0"
          delta={`${diag.overallScore.toFixed(1)}/5.0`}
          deltaPositive={diag.overallScore >= 3.5}
        />
        <MetricCard
          label="EBITDA Uplift"
          value={`+$${diag.totalEbitdaUplift.toFixed(1)}M`}
          plan={`$${diag.currentEbitda.toFixed(1)}M`}
          sub={`${diag.marginBeforePct}% → ${diag.marginAfterPct}% margin`}
          delta={`→ $${diag.potentialEbitda.toFixed(1)}M`}
          deltaPositive
        />
        <MetricCard
          label="Enterprise Value"
          value={`+$${diag.evCreated.toFixed(1)}M`}
          sub={`at ${diag.entryMultiple}x entry multiple`}
          delta={`${diag.entryMultiple}x`}
          deltaPositive
        />
        <MetricCard
          label="Cash Unlocked"
          value={`$${diag.cashUnlocked.toFixed(1)}M`}
          sub="one-time working capital"
        />
      </div>

      {/* EBITDA value bridge */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-200">EBITDA Value Bridge</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Current EBITDA plus each initiative&rsquo;s contribution → potential</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            ${diag.currentEbitda.toFixed(1)}M → ${diag.potentialEbitda.toFixed(1)}M
          </span>
        </div>
        <div className="p-4">
          <div className="flex w-full h-9 rounded-lg overflow-hidden border border-slate-800">
            <div
              className="h-full flex items-center justify-center text-[11px] font-mono text-slate-200"
              style={{ width: `${(diag.currentEbitda / bridgeMax) * 100}%`, backgroundColor: '#334155' }}
              title={`Current EBITDA $${diag.currentEbitda.toFixed(1)}M`}
            >
              ${diag.currentEbitda.toFixed(1)}M
            </div>
            {diag.initiatives.map((i) => (
              <div
                key={i.id}
                className="h-full flex items-center justify-center text-[10px] font-mono text-white/90"
                style={{ width: `${(i.ebitdaImpact / bridgeMax) * 100}%`, backgroundColor: LEVER_COLORS[i.lever], opacity: 0.85 }}
                title={`${i.title}: +$${i.ebitdaImpact.toFixed(2)}M`}
              >
                {i.ebitdaImpact / bridgeMax > 0.06 ? `+${i.ebitdaImpact.toFixed(1)}` : ''}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {diag.initiatives.map((i) => (
              <div key={i.id} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: LEVER_COLORS[i.lever] }} />
                {i.leverLabel}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        {/* Value levers */}
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Value Levers</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Benchmark scores · weakest first</p>
          </div>
          <div className="p-4 space-y-3">
            {diag.levers.map((l) => (
              <div key={l.lever}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: LEVER_COLORS[l.lever] }} />
                    <span className="text-slate-300">{l.label}</span>
                  </div>
                  <span className={`font-mono font-semibold ${getScoreColor(l.score)}`}>{l.score.toFixed(1)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(l.score / 5) * 100}%`, backgroundColor: LEVER_COLORS[l.lever], opacity: 0.85 }}
                  />
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  {l.metrics.map((mm) => `${mm.label} ${fmtMetric(mm.unit, mm.value)}`).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Initiative plan */}
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-200">Value-Creation Plan</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{diag.initiatives.length} initiatives · ranked by impact per unit of effort</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {diag.initiatives.map((i, idx) => (
              <div key={i.id} className="rounded-xl border border-slate-800 bg-[#12151d] p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-mono font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: LEVER_COLORS[i.lever] }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-100">{i.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full border"
                          style={{
                            color: LEVER_COLORS[i.lever],
                            borderColor: `${LEVER_COLORS[i.lever]}55`,
                            backgroundColor: `${LEVER_COLORS[i.lever]}14`,
                          }}
                        >
                          {i.leverLabel}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${EFFORT_STYLES[i.effort]}`}>
                          {i.effort} effort
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock size={10} /> {i.timeframeMonths} mo
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <UserRound size={10} /> {i.owner}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-mono font-semibold text-green-400">+${i.ebitdaImpact.toFixed(2)}M</div>
                    <div className="text-[10px] text-slate-600">EBITDA / yr</div>
                    {i.cashReleased > 0 && (
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">+${i.cashReleased.toFixed(1)}M cash</div>
                    )}
                  </div>
                </div>

                <p className="text-[12px] text-slate-400 leading-relaxed mt-3">{i.thesis}</p>

                <div className="flex items-center gap-2 mt-3 text-[11px]">
                  <span className="text-slate-500">{i.metricLabel}</span>
                  <span className="text-slate-300 font-mono font-medium">{fmtMetric(i.unit, i.currentValue)}</span>
                  <ArrowRight size={12} className="text-slate-600" />
                  <span className="text-green-400 font-mono font-medium">{fmtMetric(i.unit, i.targetValue)}</span>
                  <span className="text-slate-600">target</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">First Moves</div>
                    <div className="space-y-1">
                      {i.firstActions.map((a, n) => (
                        <div key={n} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <CheckCircle2 size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Track</div>
                    <div className="flex flex-wrap gap-1.5">
                      {i.kpis.map((k) => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-800 bg-[#161b27] text-slate-400">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI memo */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400" /> Value-Creation Memo
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Partner-ready narrative · powered by Think like Seth</p>
          </div>
          <button
            onClick={generateMemo}
            disabled={memoLoading}
            className="flex items-center gap-1.5 text-[12px] text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg px-3 py-1.5 transition-colors"
          >
            {memoLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {memoLoading ? 'Drafting…' : `Draft memo for ${firm.name}`}
          </button>
        </div>
        <div className="p-4">
          {memo ? (
            <div className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">{memo}</div>
          ) : (
            <p className="text-[12px] text-slate-600">
              Generate a partner memo that narrates this plan — headline opportunity, the top three initiatives with the
              reasoning and the numbers, the biggest risk, and the first move this quarter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
