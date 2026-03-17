'use client';

import { useState } from 'react';
import { companies } from '@/lib/data';
import { Initiative, FunctionArea, InitiativeStatus, Priority } from '@/lib/types';
import InitiativeTable from '@/components/initiatives/InitiativeTable';
import InitiativeBoardView from '@/components/initiatives/InitiativeBoardView';
import FilterBar from '@/components/ui/FilterBar';
import { LayoutList, Columns } from 'lucide-react';
import clsx from 'clsx';

export default function InitiativesPage() {
  const [view, setView] = useState<'list' | 'board'>('list');
  const [companyFilter, setCompanyFilter] = useState('');
  const [functionFilter, setFunctionFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const allInitiatives: Initiative[] = companies.flatMap(c => c.initiatives);

  const filtered = allInitiatives.filter(i => {
    if (companyFilter && i.companySlug !== companyFilter) return false;
    if (functionFilter && i.function !== functionFilter) return false;
    if (priorityFilter && i.priority !== priorityFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.title.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q) && !i.owner.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalValue = allInitiatives.reduce((sum, i) => sum + i.estimatedValue, 0);
  const onTrack = allInitiatives.filter(i => i.status === 'on-track' || i.status === 'complete').length;
  const overdue = allInitiatives.filter(i => i.status === 'overdue').length;
  const atRisk = allInitiatives.filter(i => i.status === 'at-risk').length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Initiatives Command Center</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">All portfolio initiatives · Q4 2024</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: allInitiatives.length, color: 'text-slate-200' },
          { label: 'On Track', value: onTrack, color: 'text-blue-400' },
          { label: 'At Risk', value: atRisk, color: 'text-amber-400' },
          { label: 'Overdue', value: overdue, color: 'text-red-400' },
          { label: 'Est. Value', value: `$${totalValue.toFixed(1)}M`, color: 'text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#161b27] border border-slate-800 rounded-xl p-4 text-center">
            <p className={clsx('text-2xl font-mono font-semibold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + View toggle */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <FilterBar
            search={{ value: search, onChange: setSearch, placeholder: 'Search initiatives...' }}
            filters={[
              {
                key: 'company',
                label: 'All Companies',
                value: companyFilter,
                onChange: setCompanyFilter,
                options: companies.map(c => ({ label: c.name, value: c.slug })),
              },
              {
                key: 'function',
                label: 'All Functions',
                value: functionFilter,
                onChange: setFunctionFilter,
                options: (['GTM', 'Finance', 'Operations', 'People', 'Technology'] as FunctionArea[]).map(f => ({ label: f, value: f })),
              },
              {
                key: 'priority',
                label: 'All Priorities',
                value: priorityFilter,
                onChange: setPriorityFilter,
                options: (['critical', 'high', 'medium', 'low'] as Priority[]).map(p => ({ label: p, value: p })),
              },
              {
                key: 'status',
                label: 'All Statuses',
                value: statusFilter,
                onChange: setStatusFilter,
                options: (['on-track', 'at-risk', 'overdue', 'complete', 'not-started'] as InitiativeStatus[]).map(s => ({ label: s, value: s })),
              },
            ]}
          />

          {/* View toggle */}
          <div className="flex items-center bg-[#0f1117] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] transition-colors',
                view === 'list' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <LayoutList size={13} />
              List
            </button>
            <button
              onClick={() => setView('board')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] transition-colors',
                view === 'board' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Columns size={13} />
              Board
            </button>
          </div>
        </div>

        {filtered.length !== allInitiatives.length && (
          <p className="text-[11px] text-slate-500 mt-2">
            Showing {filtered.length} of {allInitiatives.length} initiatives
          </p>
        )}
      </div>

      {/* Table or Board */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl p-4">
        {view === 'list' ? (
          <InitiativeTable initiatives={filtered} />
        ) : (
          <InitiativeBoardView initiatives={filtered} />
        )}
      </div>
    </div>
  );
}
