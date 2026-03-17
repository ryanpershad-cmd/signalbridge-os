import { Risk } from '@/lib/types';
import { AlertTriangle, AlertCircle, Shield } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import clsx from 'clsx';

interface RiskBoardProps {
  risks: Risk[];
}

const severityConfig = {
  critical: { label: 'Critical', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertCircle, iconColor: 'text-red-400' },
  high: { label: 'High', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle, iconColor: 'text-amber-400' },
  medium: { label: 'Medium', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: AlertTriangle, iconColor: 'text-yellow-400' },
  low: { label: 'Low', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Shield, iconColor: 'text-blue-400' },
};

const likelihoodConfig = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-green-400',
};

const statusConfig = {
  open: 'bg-red-500/10 text-red-400',
  mitigating: 'bg-amber-500/10 text-amber-400',
  resolved: 'bg-green-500/10 text-green-400',
};

export default function RiskBoard({ risks }: RiskBoardProps) {
  const openRisks = risks.filter(r => r.status !== 'resolved');
  const resolvedRisks = risks.filter(r => r.status === 'resolved');

  return (
    <div className="space-y-3">
      {openRisks.map(risk => {
        const cfg = severityConfig[risk.severity];
        const Icon = cfg.icon;
        return (
          <div key={risk.id} className={clsx('border rounded-xl p-4', risk.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-[#0f1117] border-slate-800')}>
            <div className="flex items-start gap-3">
              <Icon size={16} className={clsx('flex-shrink-0 mt-0.5', cfg.iconColor)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium', cfg.className)}>
                    {cfg.label}
                  </span>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider', statusConfig[risk.status])}>
                    {risk.status}
                  </span>
                  {risk.escalated && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase tracking-wider font-medium">
                      Escalated
                    </span>
                  )}
                  <span className="text-[10px] bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded">{risk.function}</span>
                </div>
                <h4 className="text-[13px] font-semibold text-slate-200 mb-1">{risk.title}</h4>
                <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">{risk.description}</p>

                <div className="bg-slate-900/50 rounded-lg p-3 mb-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mitigation Plan</p>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{risk.mitigationPlan}</p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                  <span>Owner: <span className="text-slate-400">{risk.owner.split(',')[0]}</span></span>
                  <span>Likelihood: <span className={likelihoodConfig[risk.likelihood]}>{risk.likelihood}</span></span>
                  <span>Open: <span className="text-slate-400 font-mono">{risk.daysOpen} days</span></span>
                  <span>Review: <span className="text-slate-400 font-mono">{formatDate(risk.nextReviewDate)}</span></span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {resolvedRisks.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Resolved</p>
          {resolvedRisks.map(risk => (
            <div key={risk.id} className="bg-[#0f1117] border border-slate-800/50 rounded-xl p-3 mb-2 opacity-60">
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-green-400" />
                <span className="text-[12px] text-slate-400 line-through">{risk.title}</span>
                <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded ml-auto">Resolved</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
