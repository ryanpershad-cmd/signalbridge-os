'use client';

import { useState } from 'react';
import { Initiative } from '@/lib/types';
import { formatDate, formatProgressColor } from '@/lib/formatters';
import InitiativeDrawer from '@/components/ui/InitiativeDrawer';
import clsx from 'clsx';

interface InitiativeTableProps {
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

const confidenceConfig = {
  high: 'text-green-400',
  medium: 'text-amber-400',
  low: 'text-red-400',
};

export default function InitiativeTable({ initiatives }: InitiativeTableProps) {
  const [selected, setSelected] = useState<Initiative | null>(null);
  const [sortKey, setSortKey] = useState<'status' | 'priority' | 'dueDate' | 'progress'>('priority');

  const sorted = [...initiatives].sort((a, b) => {
    if (sortKey === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
    if (sortKey === 'progress') return b.progress - a.progress;
    if (sortKey === 'priority') {
      const order = ['critical', 'high', 'medium', 'low'];
      return order.indexOf(a.priority) - order.indexOf(b.priority);
    }
    if (sortKey === 'status') {
      const order = ['overdue', 'at-risk', 'not-started', 'on-track', 'complete'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    }
    return 0;
  });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-800">
              {[
                { key: 'status', label: 'Status' },
                { key: null, label: 'Initiative' },
                { key: null, label: 'Company' },
                { key: null, label: 'Owner' },
                { key: null, label: 'Function' },
                { key: 'priority', label: 'Priority' },
                { key: 'dueDate', label: 'Due' },
                { key: 'progress', label: 'Progress' },
                { key: null, label: 'Value' },
                { key: null, label: 'Conf.' },
              ].map(col => (
                <th
                  key={col.label}
                  className={clsx(
                    'text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium',
                    col.key ? 'cursor-pointer hover:text-slate-300 transition-colors' : ''
                  )}
                  onClick={() => col.key && setSortKey(col.key as typeof sortKey)}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1 text-blue-400">↓</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sorted.map(init => {
              const statusCfg = statusConfig[init.status];
              return (
                <tr
                  key={init.id}
                  className="hover:bg-slate-800/20 cursor-pointer transition-colors"
                  onClick={() => setSelected(init)}
                >
                  <td className="px-3 py-3">
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium whitespace-nowrap', statusCfg.className)}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-slate-200 font-medium max-w-[200px] truncate">{init.title}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{init.companyName}</td>
                  <td className="px-3 py-3 text-slate-400 max-w-[120px] truncate">{init.owner.split(',')[0]}</td>
                  <td className="px-3 py-3">
                    <span className="bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                      {init.function}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider', priorityConfig[init.priority])}>
                      {init.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 font-mono whitespace-nowrap">{formatDate(init.dueDate)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', formatProgressColor(init.progress))}
                          style={{ width: `${init.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 w-7 text-right">{init.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-300 font-semibold whitespace-nowrap">${init.estimatedValue}M</td>
                  <td className="px-3 py-3">
                    <span className={clsx('text-[11px] font-medium capitalize', confidenceConfig[init.confidenceLevel])}>
                      {init.confidenceLevel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <InitiativeDrawer initiative={selected} onClose={() => setSelected(null)} />
    </>
  );
}
