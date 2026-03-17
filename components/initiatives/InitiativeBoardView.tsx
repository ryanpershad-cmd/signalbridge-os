'use client';

import { useState } from 'react';
import { Initiative, InitiativeStatus } from '@/lib/types';
import { formatDate, formatProgressColor } from '@/lib/formatters';
import InitiativeDrawer from '@/components/ui/InitiativeDrawer';
import clsx from 'clsx';

interface InitiativeBoardViewProps {
  initiatives: Initiative[];
}

const columns: { status: InitiativeStatus; label: string; color: string; bg: string }[] = [
  { status: 'not-started', label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-700/20' },
  { status: 'on-track', label: 'On Track', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { status: 'at-risk', label: 'At Risk', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { status: 'overdue', label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10' },
  { status: 'complete', label: 'Complete', color: 'text-green-400', bg: 'bg-green-500/10' },
];

const priorityConfig = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-600',
};

export default function InitiativeBoardView({ initiatives }: InitiativeBoardViewProps) {
  const [selected, setSelected] = useState<Initiative | null>(null);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map(col => {
          const colInitiatives = initiatives.filter(i => i.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-64">
              <div className={clsx('rounded-lg px-3 py-2 mb-3 flex items-center justify-between', col.bg)}>
                <span className={clsx('text-[12px] font-semibold uppercase tracking-wider', col.color)}>
                  {col.label}
                </span>
                <span className={clsx('text-[11px] font-mono font-bold', col.color)}>
                  {colInitiatives.length}
                </span>
              </div>
              <div className="space-y-2">
                {colInitiatives.map(init => (
                  <div
                    key={init.id}
                    className={clsx(
                      'bg-[#161b27] border border-slate-800 border-l-2 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-colors',
                      priorityConfig[init.priority]
                    )}
                    onClick={() => setSelected(init)}
                  >
                    <p className="text-[12px] font-medium text-slate-200 mb-1 leading-snug">{init.title}</p>
                    <p className="text-[11px] text-slate-500 mb-2">{init.companyName}</p>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-600">Progress</span>
                        <span className="text-[10px] font-mono text-slate-400">{init.progress}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', formatProgressColor(init.progress))}
                          style={{ width: `${init.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{init.owner.split(',')[0]}</span>
                      <span className="text-[10px] font-mono text-slate-500">{formatDate(init.dueDate)}</span>
                    </div>
                  </div>
                ))}
                {colInitiatives.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-slate-700">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <InitiativeDrawer initiative={selected} onClose={() => setSelected(null)} />
    </>
  );
}
