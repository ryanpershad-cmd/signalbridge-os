'use client';

import { useState } from 'react';
import { companies } from '@/lib/data';
import { Risk, RiskSeverity, FunctionArea } from '@/lib/types';
import RiskRegister from '@/components/risks/RiskRegister';
import RiskMatrix from '@/components/risks/RiskMatrix';
import FilterBar from '@/components/ui/FilterBar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function RisksPage() {
  const [companyFilter, setCompanyFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [functionFilter, setFunctionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const allRisks: Risk[] = companies.flatMap(c => c.risks);

  const openRisks = allRisks.filter(r => r.status !== 'resolved');
  const resolvedRisks = allRisks.filter(r => r.status === 'resolved');
  const criticalRisks = openRisks.filter(r => r.severity === 'critical');
  const highRisks = openRisks.filter(r => r.severity === 'high');
  const escalated = openRisks.filter(r => r.escalated);

  const filtered = openRisks.filter(r => {
    if (companyFilter && r.companySlug !== companyFilter) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    if (functionFilter && r.function !== functionFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  // Executive summary
  const summaryLines = [
    `Portfolio risk posture: ${criticalRisks.length} critical and ${highRisks.length} high risks currently open across ${companies.length} portfolio companies.`,
    `${escalated.length} risks are escalated and require immediate GP-level attention: ${escalated.map(r => `${r.companyName} — ${r.title}`).join('; ')}.`,
    `Apex Health represents the most concentrated risk exposure with 4 open risks including 2 critical (Medicaid reimbursement and COO leadership gap). Both are on active mitigation plans.`,
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Risks & Blockers</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Portfolio risk register · Q4 2024</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Open', value: openRisks.length, color: 'text-slate-200' },
          { label: 'Critical', value: criticalRisks.length, color: 'text-red-400' },
          { label: 'High', value: highRisks.length, color: 'text-amber-400' },
          { label: 'Escalated', value: escalated.length, color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className={clsx(
            'bg-[#161b27] border rounded-xl p-4 text-center',
            stat.label === 'Critical' && criticalRisks.length > 0 ? 'border-red-500/30' : 'border-slate-800'
          )}>
            <p className={clsx('text-2xl font-mono font-semibold', stat.color)}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Executive summary */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl p-5">
        <h2 className="text-[13px] font-semibold text-slate-200 mb-3">Risk Posture Executive Summary</h2>
        <div className="space-y-2">
          {summaryLines.map((line, idx) => (
            <p key={idx} className="text-[12px] text-slate-400 leading-relaxed">{line}</p>
          ))}
        </div>
      </div>

      {/* Risk matrix */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Severity × Likelihood Matrix</h2>
          <p className="text-[11px] text-slate-500">Open risks plotted by severity and likelihood</p>
        </div>
        <div className="p-5">
          <RiskMatrix risks={openRisks} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl p-4">
        <FilterBar
          filters={[
            {
              key: 'company',
              label: 'All Companies',
              value: companyFilter,
              onChange: setCompanyFilter,
              options: companies.map(c => ({ label: c.name, value: c.slug })),
            },
            {
              key: 'severity',
              label: 'All Severities',
              value: severityFilter,
              onChange: setSeverityFilter,
              options: (['critical', 'high', 'medium', 'low'] as RiskSeverity[]).map(s => ({ label: s, value: s })),
            },
            {
              key: 'function',
              label: 'All Functions',
              value: functionFilter,
              onChange: setFunctionFilter,
              options: (['GTM', 'Finance', 'Operations', 'People', 'Technology'] as FunctionArea[]).map(f => ({ label: f, value: f })),
            },
            {
              key: 'status',
              label: 'All Statuses',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: 'Open', value: 'open' },
                { label: 'Mitigating', value: 'mitigating' },
              ],
            },
          ]}
        />
        {filtered.length !== openRisks.length && (
          <p className="text-[11px] text-slate-500 mt-2">Showing {filtered.length} of {openRisks.length} open risks</p>
        )}
      </div>

      {/* Risk register */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Risk Register</h2>
        </div>
        <div className="p-2">
          <RiskRegister risks={filtered} />
        </div>
      </div>

      {/* Resolved risks */}
      {resolvedRisks.length > 0 && (
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <button
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
            onClick={() => setShowResolved(!showResolved)}
          >
            <h2 className="text-[13px] font-semibold text-slate-500">
              Resolved Risks ({resolvedRisks.length})
            </h2>
            {showResolved ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
          </button>
          {showResolved && (
            <div className="px-5 pb-4">
              <RiskRegister risks={resolvedRisks} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
