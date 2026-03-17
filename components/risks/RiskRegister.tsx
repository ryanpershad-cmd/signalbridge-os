'use client';

import { Risk } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { AlertCircle, AlertTriangle, Shield } from 'lucide-react';
import clsx from 'clsx';

interface RiskRegisterProps {
  risks: Risk[];
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-400', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high: { icon: AlertTriangle, color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  medium: { icon: AlertTriangle, color: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  low: { icon: Shield, color: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const statusBadge = {
  open: 'bg-red-500/10 text-red-400',
  mitigating: 'bg-amber-500/10 text-amber-400',
  resolved: 'bg-green-500/10 text-green-400',
};

const likelihoodColor = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-green-400',
};

export default function RiskRegister({ risks }: RiskRegisterProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-slate-800">
            {['Severity', 'Risk', 'Company', 'Function', 'Likelihood', 'Status', 'Owner', 'Days Open', 'Next Review', ''].map(h => (
              <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {risks.map(risk => {
            const cfg = severityConfig[risk.severity];
            const Icon = cfg.icon;
            return (
              <tr key={risk.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-3 py-3">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium', cfg.badge)}>
                    {risk.severity}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[200px]">
                  <div className="flex items-start gap-2">
                    <Icon size={13} className={clsx('flex-shrink-0 mt-0.5', cfg.color)} />
                    <div>
                      <p className="text-slate-200 font-medium">{risk.title}</p>
                      {risk.escalated && (
                        <span className="text-[10px] bg-red-500/15 text-red-400 px-1 py-0.5 rounded">Escalated</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{risk.companyName}</td>
                <td className="px-3 py-3">
                  <span className="bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{risk.function}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={clsx('font-medium capitalize text-[11px]', likelihoodColor[risk.likelihood])}>
                    {risk.likelihood}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded capitalize', statusBadge[risk.status])}>
                    {risk.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-400 max-w-[120px] truncate">{risk.owner.split(',')[0]}</td>
                <td className="px-3 py-3 font-mono text-slate-400">{risk.daysOpen}d</td>
                <td className="px-3 py-3 font-mono text-slate-400 whitespace-nowrap">{formatDate(risk.nextReviewDate)}</td>
                <td className="px-3 py-3 text-right">
                  {/* placeholder action */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
