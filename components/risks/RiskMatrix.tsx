'use client';

import { Risk } from '@/lib/types';
import clsx from 'clsx';

interface RiskMatrixProps {
  risks: Risk[];
}

const likelihood = ['high', 'medium', 'low'] as const;
const severity = ['low', 'medium', 'high', 'critical'] as const;

const cellColor = (sev: string, like: string): string => {
  const score = (severity.indexOf(sev as any) + 1) * (likelihood.indexOf(like as any) === 0 ? 3 : likelihood.indexOf(like as any) === 1 ? 2 : 1);
  if (score >= 8) return 'bg-red-500/20 border-red-500/20';
  if (score >= 5) return 'bg-amber-500/20 border-amber-500/20';
  if (score >= 3) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-slate-800/30 border-slate-700/20';
};

export default function RiskMatrix({ risks }: RiskMatrixProps) {
  const getRisksForCell = (sev: string, like: string) =>
    risks.filter(r => r.severity === sev && r.likelihood === like && r.status !== 'resolved');

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-24 pb-2" />
            {severity.map(s => (
              <th key={s} className="pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium text-center px-2">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {likelihood.map(like => (
            <tr key={like}>
              <td className="pr-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium text-right w-24">
                {like}
              </td>
              {severity.map(sev => {
                const cellRisks = getRisksForCell(sev, like);
                return (
                  <td key={sev} className="p-1.5">
                    <div className={clsx('border rounded-lg p-2 min-h-[72px]', cellColor(sev, like))}>
                      {cellRisks.length === 0 ? (
                        <div className="flex items-center justify-center h-full opacity-30">
                          <span className="text-[10px] text-slate-600">—</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {cellRisks.slice(0, 3).map(r => (
                            <div key={r.id} className="bg-[#0f1117]/80 rounded px-1.5 py-1">
                              <p className="text-[10px] text-slate-300 font-medium leading-snug truncate max-w-[120px]">
                                {r.title}
                              </p>
                              <p className="text-[9px] text-slate-600 truncate max-w-[120px]">{r.companyName}</p>
                            </div>
                          ))}
                          {cellRisks.length > 3 && (
                            <p className="text-[10px] text-slate-500 text-center">+{cellRisks.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-4 justify-end">
        <span className="text-[10px] text-slate-600">Rows = Likelihood · Columns = Severity</span>
      </div>
    </div>
  );
}
