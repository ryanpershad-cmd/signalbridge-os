'use client';

import { KPI } from '@/lib/types';
import { formatNumber } from '@/lib/formatters';
import TrendArrow from '@/components/ui/TrendArrow';
import SparklineChart from '@/components/charts/SparklineChart';
import clsx from 'clsx';

interface KPIScorecardProps {
  kpis: KPI[];
}

function getAttainmentColor(value: number, target: number, unit: string): string {
  // For metrics where lower is better (payer approval cycle, churn, turnover, CAC payback, logo churn)
  const inverseMetrics = ['days', 'months'];
  const isInverse = inverseMetrics.includes(unit) ||
    unit === '%' && false; // some % are inverse but we'll check contextually

  const ratio = value / target;
  if (isInverse) {
    if (ratio <= 0.85) return 'text-green-400';
    if (ratio <= 1.05) return 'text-amber-400';
    return 'text-red-400';
  }

  if (ratio >= 1.02) return 'text-green-400';
  if (ratio >= 0.95) return 'text-blue-400';
  if (ratio >= 0.88) return 'text-amber-400';
  return 'text-red-400';
}

function getKPIAttainmentPct(value: number, target: number): number {
  return (value / target) * 100;
}

export default function KPIScorecard({ kpis }: KPIScorecardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {kpis.map(kpi => {
        const attainmentPct = getKPIAttainmentPct(kpi.value, kpi.target);
        const delta = kpi.value - kpi.target;
        const deltaIsPositive = delta >= 0;
        const attainmentColor = getAttainmentColor(kpi.value, kpi.target, kpi.unit);

        return (
          <div key={kpi.id} className="bg-[#161b27] border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">{kpi.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className={clsx('text-2xl font-mono font-semibold', attainmentColor)}>
                    {formatNumber(kpi.value, kpi.unit)}
                  </span>
                  <TrendArrow direction={kpi.trend} size={14} />
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Target: {formatNumber(kpi.target, kpi.unit)}
                  <span className={clsx(
                    'ml-2 font-semibold',
                    deltaIsPositive ? 'text-green-400' : 'text-red-400'
                  )}>
                    ({deltaIsPositive ? '+' : ''}{delta.toFixed(1)}{kpi.unit === '%' ? 'pt' : ''})
                  </span>
                </p>
              </div>
            </div>

            {/* Attainment bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-600">Attainment</span>
                <span className={clsx('text-[11px] font-mono font-semibold', attainmentColor)}>
                  {attainmentPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full',
                    attainmentPct >= 102 ? 'bg-green-500' :
                    attainmentPct >= 95 ? 'bg-blue-500' :
                    attainmentPct >= 88 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(attainmentPct, 120)}%` }}
                />
              </div>
            </div>

            {/* Sparkline */}
            <SparklineChart data={kpi.history} trend={kpi.trend} height={36} />

            {kpi.description && (
              <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">{kpi.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
