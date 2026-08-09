'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Database,
  Plug,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { firms } from '@/lib/firm/firms';
import { SERVICE_LINE_LABELS, SYSTEM_LABELS } from '@/lib/firm/types';
import { BENCHMARKS, scoreMetric, metricGap } from '@/lib/firm/benchmarks';
import { getScoreBgColor, getScoreColor } from '@/lib/scoring';
import { formatMonthLabel } from '@/lib/formatters';

function fmtMetric(unit: string, value: number): string {
  switch (unit) {
    case '%':
      return `${value.toFixed(1)}%`;
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

const STATUS_LABELS: Record<string, string> = {
  platform: 'Platform Anchor',
  performing: 'Performing',
  watch: 'Watch',
  turnaround: 'Turnaround',
};

export default function IngestionPage() {
  const [activeSlug, setActiveSlug] = useState(firms[0].slug);
  const firm = firms.find((f) => f.slug === activeSlug)!;
  const m = firm.metrics;
  const raw = firm.raw;

  const rawFacts = [
    { label: 'Available hours', value: raw.timeAndBilling.availableHours.toLocaleString() },
    { label: 'Billed hours', value: raw.timeAndBilling.billedHours.toLocaleString() },
    { label: 'Standard fees', value: `$${raw.timeAndBilling.standardFees.toFixed(1)}M` },
    { label: 'Realized fees', value: `$${raw.timeAndBilling.realizedFees.toFixed(1)}M` },
    { label: 'WIP', value: `$${raw.wip.toFixed(1)}M` },
    { label: 'A/R', value: `$${raw.ar.toFixed(1)}M` },
    { label: 'A/R > 90d', value: `$${raw.arOver90.toFixed(1)}M` },
    { label: 'Clients', value: raw.clients.count.toLocaleString() },
  ];

  const maxMonthly = Math.max(...firm.monthlyRevenue.map((d) => d.revenue));
  const chartData = firm.monthlyRevenue.map((d) => ({
    month: formatMonthLabel(d.month),
    revenue: d.revenue,
    busy: d.month <= '2024-04',
  }));

  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Database size={18} className="text-blue-400" />
          <h1 className="text-xl font-semibold text-slate-100">Financial Ingestion</h1>
        </div>
        <p className="text-sm text-slate-400">
          Connect each acquired firm&rsquo;s accounting system, pull its ledger, and normalize into a
          common operating profile. {firms.length} firms connected.
        </p>
      </div>

      {/* Connected sources */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {firms.map((f) => {
          const active = f.slug === activeSlug;
          return (
            <button
              key={f.slug}
              onClick={() => setActiveSlug(f.slug)}
              className={`text-left rounded-xl border p-3 transition-colors ${
                active
                  ? 'border-blue-500/60 bg-blue-500/10'
                  : 'border-slate-800 bg-[#161a23] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: f.accentColor }}
                />
                <span className="text-[12px] font-medium text-slate-200 truncate">{f.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
                <Plug size={11} />
                <span className="truncate">{SYSTEM_LABELS[f.system]}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green-400">
                <CheckCircle2 size={10} />
                Synced {raw.pulledAt === f.raw.pulledAt ? f.raw.pulledAt : f.raw.pulledAt}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected firm header */}
      <div className="rounded-xl border border-slate-800 bg-[#161a23] p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: firm.accentColor }}
              />
              <h2 className="text-lg font-semibold text-slate-100">{firm.name}</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getScoreBgColor(scoreMetric('ebitdaMarginPct', m.ebitdaMarginPct))}`}>
                {STATUS_LABELS[firm.status]}
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              {firm.hq} · Founded {firm.founded} · {firm.focus} · Acquired{' '}
              {new Date(firm.acquisitionDate).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}{' '}
              at {firm.entryMultiple}x
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-[12px] text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800 transition-colors">
            <RefreshCw size={12} />
            Re-sync
          </button>
        </div>
      </div>

      {/* Raw -> Normalized */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_40px_1fr] gap-4 items-start mb-6">
        {/* Raw pull */}
        <div className="rounded-xl border border-slate-800 bg-[#12151d] p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet size={14} className="text-slate-400" />
            <span className="text-[12px] font-medium text-slate-300">Raw pull</span>
            <span className="text-[10px] text-slate-600 ml-auto">{SYSTEM_LABELS[firm.system]}</span>
          </div>
          <div className="space-y-1.5">
            {rawFacts.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">{f.label}</span>
                <span className="text-slate-300 font-medium tabular-nums">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center justify-center h-full pt-8">
          <ArrowRight size={22} className="text-blue-500/70" />
        </div>

        {/* Normalized metrics */}
        <div className="rounded-xl border border-slate-800 bg-[#12151d] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] font-medium text-slate-300">Normalized operating profile</span>
            <span className="text-[10px] text-slate-600 ml-auto">vs. platform benchmark</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {BENCHMARKS.map((b) => {
              const value = m[b.key];
              const score = scoreMetric(b.key, value);
              const gap = metricGap(b.key, value);
              const behind = gap < 0;
              return (
                <div key={b.key} className="rounded-lg border border-slate-800/80 bg-[#161a23] p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 leading-tight">{b.label}</span>
                    <span className={`text-[10px] font-semibold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-slate-100 tabular-nums">
                    {fmtMetric(b.unit, value)}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    target {fmtMetric(b.unit, b.target)}
                    <span className={`ml-1.5 ${behind ? 'text-amber-500' : 'text-green-500'}`}>
                      {behind ? '▼' : '▲'} {fmtMetric(b.unit, Math.abs(gap))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service mix + seasonality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service lines */}
        <div className="rounded-xl border border-slate-800 bg-[#161a23] p-5">
          <h3 className="text-[13px] font-medium text-slate-300 mb-4">Service-line mix</h3>
          <div className="space-y-3">
            {firm.serviceLines
              .filter((s) => s.revenue > 0)
              .sort((a, b) => b.revenue - a.revenue)
              .map((s) => (
                <div key={s.line}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-slate-300">{SERVICE_LINE_LABELS[s.line]}</span>
                    <span className="text-slate-400 tabular-nums">
                      ${s.revenue.toFixed(1)}M · {s.revenueSharePct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.revenueSharePct}%`,
                        backgroundColor: firm.accentColor,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {s.recurringPct}% recurring · {s.grossMarginPct}% gross margin
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Seasonality */}
        <div className="rounded-xl border border-slate-800 bg-[#161a23] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-medium text-slate-300">Revenue seasonality (LTM)</h3>
            <span className="text-[11px] text-amber-400">
              {m.seasonalityIndex.toFixed(0)}% in busy season
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: '#ffffff08' }}
                contentStyle={{
                  background: '#0f1117',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(v) => [`$${Number(v).toFixed(2)}M`, 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={26}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.busy ? firm.accentColor : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-600 mt-2">
            Jan–Apr highlighted. Peak of ${maxMonthly.toFixed(1)}M in busy season vs. off-season
            trough — the capacity-planning constraint the labor model has to absorb.
          </p>
        </div>
      </div>
    </div>
  );
}
