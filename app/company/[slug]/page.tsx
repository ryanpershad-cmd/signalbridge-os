'use client';

import { useState } from 'react';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { getCompanyBySlug } from '@/lib/data';
import CompanyHeader from '@/components/company/CompanyHeader';
import KPIScorecard from '@/components/company/KPIScorecard';
import InitiativesTracker from '@/components/company/InitiativesTracker';
import RiskBoard from '@/components/company/RiskBoard';
import CommentaryFeed from '@/components/company/CommentaryFeed';
import FunctionalScores from '@/components/company/FunctionalScores';
import CompanyOverviewChart from '@/components/company/CompanyOverviewChart';
import MetricCard from '@/components/ui/MetricCard';
import { formatCurrency } from '@/lib/formatters';
import clsx from 'clsx';
import { CheckSquare, BarChart2, Target, AlertTriangle, Calendar } from 'lucide-react';

type Tab = 'overview' | 'kpis' | 'initiatives' | 'risks' | 'cadence';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart2 size={14} /> },
  { id: 'kpis', label: 'KPIs', icon: <Target size={14} /> },
  { id: 'initiatives', label: 'Initiatives', icon: <CheckSquare size={14} /> },
  { id: 'risks', label: 'Risks', icon: <AlertTriangle size={14} /> },
  { id: 'cadence', label: 'Cadence', icon: <Calendar size={14} /> },
];

export default function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const company = getCompanyBySlug(slug);

  if (!company) notFound();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Compute summary metrics
  const ltmRevenue = company.monthlyFinancials.reduce((sum, m) => sum + m.revenue, 0);
  const ltmRevenuePlan = company.monthlyFinancials.reduce((sum, m) => sum + m.revenuePlan, 0);
  const ltmEBITDA = company.monthlyFinancials.reduce((sum, m) => sum + m.ebitda, 0);
  const ltmEBITDAPlan = company.monthlyFinancials.reduce((sum, m) => sum + m.ebitdaPlan, 0);
  const revenueAtt = ((ltmRevenue / ltmRevenuePlan - 1) * 100);
  const ebitdaAtt = ((ltmEBITDA / ltmEBITDAPlan - 1) * 100);
  const ebitdaMargin = (ltmEBITDA / ltmRevenue * 100);
  const latestMonth = company.monthlyFinancials[company.monthlyFinancials.length - 1];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Company header */}
      <CompanyHeader company={company} />

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Revenue LTM"
          value={formatCurrency(ltmRevenue)}
          plan={formatCurrency(ltmRevenuePlan)}
          delta={`${revenueAtt >= 0 ? '+' : ''}${revenueAtt.toFixed(1)}%`}
          deltaPositive={revenueAtt >= 0}
          trend={company.frameworkScore.trend}
        />
        <MetricCard
          label="EBITDA LTM"
          value={formatCurrency(ltmEBITDA)}
          plan={formatCurrency(ltmEBITDAPlan)}
          delta={`${ebitdaAtt >= 0 ? '+' : ''}${ebitdaAtt.toFixed(1)}%`}
          deltaPositive={ebitdaAtt >= 0}
          sub={`${ebitdaMargin.toFixed(1)}% margin`}
        />
        <MetricCard
          label="Latest Month Revenue"
          value={formatCurrency(latestMonth.revenue)}
          plan={formatCurrency(latestMonth.revenuePlan)}
          delta={`${((latestMonth.revenue / latestMonth.revenuePlan - 1) * 100).toFixed(1)}%`}
          deltaPositive={latestMonth.revenue >= latestMonth.revenuePlan}
        />
        <MetricCard
          label="Framework Score"
          value={company.frameworkScore.overall.toFixed(1)}
          sub="out of 5.0"
          trend={company.frameworkScore.trend}
          deltaPositive={company.frameworkScore.overall >= 3.5}
          delta={company.status.replace('-', ' ')}
        />
      </div>

      {/* Tabs */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="border-b border-slate-800 px-5">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3.5 text-[12px] font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* P&L Chart */}
              <div>
                <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Monthly P&L Trend — 2024</h3>
                <CompanyOverviewChart financials={company.monthlyFinancials} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Functional scores */}
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Functional Health Scores</h3>
                  <FunctionalScores scores={company.functionalScores} />
                </div>

                {/* Recent commentary */}
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Recent Commentary</h3>
                  <CommentaryFeed commentary={company.commentary} limit={3} />
                </div>
              </div>

              {/* Benchmark + Recommended Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Benchmark vs Portfolio Average</h3>
                  <div className="space-y-2">
                    {Object.entries(company.benchmarkVsPortfolio).map(([key, delta]) => {
                      const labels: Record<string, string> = {
                        revenueAttainment: 'Revenue Attainment vs Plan',
                        ebitdaMarginDelta: 'EBITDA Margin Delta (pts)',
                        initiativesOnTrack: 'Initiatives On-Track Delta (%)',
                        headcountAttainment: 'Headcount Attainment Delta (%)',
                      };
                      const isPositive = delta >= 0;
                      return (
                        <div key={key} className="flex items-center justify-between bg-[#0f1117] rounded-lg px-4 py-3">
                          <span className="text-[12px] text-slate-400">{labels[key] ?? key}</span>
                          <span className={clsx(
                            'text-[12px] font-mono font-semibold',
                            isPositive ? 'text-green-400' : 'text-red-400'
                          )}>
                            {isPositive ? '+' : ''}{delta.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Recommended Platform Actions</h3>
                  <div className="space-y-2">
                    {company.recommendedActions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-[#0f1117] rounded-lg px-4 py-3">
                        <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-[12px] text-slate-400 leading-relaxed">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leadership roster */}
              <div>
                <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Leadership Roster</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {company.leadership.map((leader, idx) => (
                    <div key={idx} className={clsx(
                      'bg-[#0f1117] border rounded-lg p-3',
                      leader.filled ? 'border-slate-800' : 'border-red-500/30'
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">{leader.role}</p>
                          <p className={clsx('text-[12px] font-medium', leader.filled ? 'text-slate-200' : 'text-red-400')}>
                            {leader.filled ? leader.name : 'Unfilled'}
                          </p>
                        </div>
                        {leader.filled && (
                          <span className="text-[10px] text-slate-500 font-mono">{leader.tenureMonths}mo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Headcount summary */}
              <div>
                <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Headcount Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xl font-mono font-semibold text-slate-100">{company.headcount.total}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total</p>
                    <p className="text-[10px] text-slate-600 font-mono">Plan: {company.headcount.plan}</p>
                  </div>
                  <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xl font-mono font-semibold text-amber-400">{company.headcount.openRoles}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Open Roles</p>
                  </div>
                  <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xl font-mono font-semibold text-blue-400">{company.headcount.recentHires}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Recent Hires</p>
                  </div>
                  <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3 text-center">
                    <p className={clsx(
                      'text-xl font-mono font-semibold capitalize',
                      company.headcount.attritionRisk === 'high' ? 'text-red-400' :
                      company.headcount.attritionRisk === 'medium' ? 'text-amber-400' : 'text-green-400'
                    )}>
                      {company.headcount.attritionRisk}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Attrition Risk</p>
                  </div>
                </div>
                {company.headcount.keyOpenRoles.length > 0 && (
                  <div className="mt-2 bg-[#0f1117] border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Key Open Roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {company.headcount.keyOpenRoles.map((role, idx) => (
                        <span key={idx} className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPIs tab */}
          {activeTab === 'kpis' && (
            <div>
              <h3 className="text-[13px] font-semibold text-slate-200 mb-4">KPI Scorecard — Q4 2024</h3>
              <KPIScorecard kpis={company.kpis} />
            </div>
          )}

          {/* Initiatives tab */}
          {activeTab === 'initiatives' && (
            <div>
              <h3 className="text-[13px] font-semibold text-slate-200 mb-4">Initiatives Tracker</h3>
              <InitiativesTracker initiatives={company.initiatives} />
            </div>
          )}

          {/* Risks tab */}
          {activeTab === 'risks' && (
            <div>
              <h3 className="text-[13px] font-semibold text-slate-200 mb-4">Risk Board</h3>
              <RiskBoard risks={company.risks} />
            </div>
          )}

          {/* Cadence tab */}
          {activeTab === 'cadence' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[13px] font-semibold text-slate-200 mb-3">Full Commentary Log</h3>
                <CommentaryFeed commentary={company.commentary} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
