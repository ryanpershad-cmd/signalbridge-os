'use client';

import { useState } from 'react';
import { Initiative } from '@/lib/types';
import { formatDate, formatProgressColor } from '@/lib/formatters';
import InitiativeDrawer from '@/components/ui/InitiativeDrawer';
import clsx from 'clsx';

interface InitiativesTrackerProps {
  initiatives: Initiative[];
}

const statusConfig = {
  'on-track': { label: 'On Track', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'at-risk': { label: 'At Risk', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'overdue': { label: 'Overdue', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  'complete': { label: 'Complete', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  'not-started': { label: 'Not Started', className: 'bg-slate-700/50 text-slate-400 border-slate-600/30' },
};

const priorityConfig = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-amber-500/15 text-amber-400',
  medium: 'bg-blue-500/15 text-blue-400',
  low: 'bg-slate-700/50 text-slate-400',
};

export default function InitiativesTracker({ initiatives }: InitiativesTrackerProps) {
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  const onTrack = initiatives.filter(i => i.status === 'on-track' || i.status === 'complete').length;
  const atRisk = initiatives.filter(i => i.status === 'at-risk').length;
  const overdue = initiatives.filter(i => i.status === 'overdue').length;
  const totalValue = initiatives.reduce((sum, i) => sum + i.estimatedValue, 0);

  return (
    <>
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total', value: initiatives.length, color: 'text-slate-200' },
          { label: 'On Track', value: onTrack, color: 'text-blue-400' },
          { label: 'At Risk', value: atRisk, color: 'text-amber-400' },
          { label: 'Overdue', value: overdue, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0f1117] border border-slate-800 rounded-xl p-3 text-center">
            <p className={clsx('text-2xl font-mono font-semibold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Initiatives table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Status</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Initiative</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Owner</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Function</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Priority</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Due</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium w-28">Progress</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {initiatives.map(initiative => {
              const statusCfg = statusConfig[initiative.status];
              return (
                <tr
                  key={initiative.id}
                  className="hover:bg-slate-800/20 cursor-pointer transition-colors"
                  onClick={() => setSelectedInitiative(initiative)}
                >
                  <td className="px-3 py-3">
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium', statusCfg.className)}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-slate-200 font-medium">{initiative.title}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-400">{initiative.owner.split(',')[0]}</td>
                  <td className="px-3 py-3">
                    <span className="bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                      {initiative.function}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider', priorityConfig[initiative.priority])}>
                      {initiative.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 font-mono">{formatDate(initiative.dueDate)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', formatProgressColor(initiative.progress))}
                          style={{ width: `${initiative.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 w-7 text-right">{initiative.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-300 font-semibold">
                    ${initiative.estimatedValue}M
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InitiativeDrawer initiative={selectedInitiative} onClose={() => setSelectedInitiative(null)} />
    </>
  );
}
