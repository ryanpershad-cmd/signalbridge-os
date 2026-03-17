import clsx from 'clsx';
import TrendArrow from './TrendArrow';
import { TrendDirection } from '@/lib/types';

interface MetricCardProps {
  label: string;
  value: string;
  plan?: string;
  delta?: string;
  deltaPositive?: boolean;
  trend?: TrendDirection;
  sub?: string;
  alert?: boolean;
  className?: string;
}

export default function MetricCard({
  label,
  value,
  plan,
  delta,
  deltaPositive,
  trend,
  sub,
  alert = false,
  className,
}: MetricCardProps) {
  return (
    <div
      className={clsx(
        'bg-[#161b27] border rounded-xl p-4',
        alert ? 'border-red-500/30' : 'border-slate-800',
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-mono font-semibold text-slate-100">{value}</p>
          {plan && (
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Plan: {plan}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {delta && (
            <span
              className={clsx(
                'text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded',
                deltaPositive === true
                  ? 'bg-green-500/15 text-green-400'
                  : deltaPositive === false
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-slate-700/50 text-slate-400'
              )}
            >
              {delta}
            </span>
          )}
          {trend && <TrendArrow direction={trend} size={16} />}
        </div>
      </div>
      {sub && <p className="text-[11px] text-slate-500 mt-1.5">{sub}</p>}
    </div>
  );
}
