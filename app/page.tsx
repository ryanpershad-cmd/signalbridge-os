'use client';

import { useState } from 'react';
import Link from 'next/link';
import { companies } from '@/lib/data';
import { getPortfolioSummary, getPortfolioMonthlyTrend, getAttentionItems, getPlatformWins, getWeeklyReviewTopics, generateExecutiveBrief } from '@/lib/aggregations';
import MetricCard from '@/components/ui/MetricCard';
import HeatmapTable from '@/components/dashboard/HeatmapTable';
import AttentionPanel from '@/components/dashboard/AttentionPanel';
import PlatformWins from '@/components/dashboard/PlatformWins';
import WeeklyReviewPanel from '@/components/dashboard/WeeklyReviewPanel';
import ExecutiveBrief from '@/components/dashboard/ExecutiveBrief';
import PortfolioTrendChart from '@/components/charts/PortfolioTrendChart';
import StatusBadge from '@/components/ui/StatusBadge';
import ScoreChip from '@/components/ui/ScoreChip';
import { formatCurrency, formatDelta } from '@/lib/formatters';

export default function PortfolioOverview() {
  const [sectorFilter, setSectorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const summary = getPortfolioSummary(companies);
  const trendData = getPortfolioMonthlyTrend(companies);
  const attentionItems = getAttentionItems(companies);
  const platformWins = getPlatformWins(companies);
  const reviewTopics = getWeeklyReviewTopics(companies);
  const executiveBrief = generateExecutiveBrief(companies);

  const filteredCompanies = companies.filter(c => {
    if (sectorFilter && c.sector !== sectorFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const revenueAttPct = ((summary.totalRevenueLTM / summary.totalRevenuePlan - 1) * 100);
  const ebitdaAttPct = ((summary.totalEBITDALTM / summary.totalEBITDAPlan - 1) * 100);
  const ebitdaMargin = (summary.totalEBITDALTM / summary.totalRevenueLTM * 100);

  const sortedByScore = [...companies].sort((a, b) => b.frameworkScore.overall - a.frameworkScore.overall);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Portfolio Overview</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">SignalBridge Capital · Q4 2024 · As of December 9, 2024</p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="bg-[#161b27] border border-slate-800 rounded-lg px-3 py-1.5 text-[12px] text-slate-400 outline-none focus:border-blue-500/50"
          >
            <option value="">All Sectors</option>
            <option value="CPG">CPG</option>
            <option value="Healthcare Services">Healthcare</option>
            <option value="Logistics">Logistics</option>
            <option value="B2B SaaS">B2B SaaS</option>
            <option value="Home Services">Home Services</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#161b27] border border-slate-800 rounded-lg px-3 py-1.5 text-[12px] text-slate-400 outline-none focus:border-blue-500/50"
          >
            <option value="">All Status</option>
            <option value="outperforming">Outperforming</option>
            <option value="on-track">On Track</option>
            <option value="watch">Watch</option>
            <option value="intervention">Intervention</option>
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Revenue LTM"
          value={formatCurrency(summary.totalRevenueLTM)}
          plan={formatCurrency(summary.totalRevenuePlan)}
          delta={`${revenueAttPct >= 0 ? '+' : ''}${revenueAttPct.toFixed(1)}%`}
          deltaPositive={revenueAttPct >= 0}
          trend={summary.trendRevenue}
        />
        <MetricCard
          label="EBITDA LTM"
          value={formatCurrency(summary.totalEBITDALTM)}
          plan={formatCurrency(summary.totalEBITDAPlan)}
          delta={`${ebitdaAttPct >= 0 ? '+' : ''}${ebitdaAttPct.toFixed(1)}%`}
          deltaPositive={ebitdaAttPct >= 0}
          sub={`${ebitdaMargin.toFixed(1)}% margin`}
          trend={summary.trendEBITDA}
        />
        <MetricCard
          label="Avg Execution Score"
          value={summary.avgExecutionScore.toFixed(1)}
          sub="out of 5.0"
          trend="up"
          delta={`${summary.avgExecutionScore.toFixed(1)}/5.0`}
          deltaPositive={summary.avgExecutionScore >= 3.5}
        />
        <MetricCard
          label="Initiatives On Track"
          value={`${summary.initiativesOnTrackPct.toFixed(0)}%`}
          sub={`${companies.flatMap(c => c.initiatives).filter(i => i.status === 'on-track' || i.status === 'complete').length} of ${companies.flatMap(c => c.initiatives).length} initiatives`}
          deltaPositive={summary.initiativesOnTrackPct >= 70}
          delta={`${summary.initiativesOnTrackPct.toFixed(0)}%`}
        />
        <MetricCard
          label="Open Critical Risks"
          value={String(summary.openCriticalRisks)}
          sub="portfolio-wide"
          alert={summary.openCriticalRisks > 2}
          deltaPositive={summary.openCriticalRisks === 0}
          delta={summary.openCriticalRisks > 2 ? `${summary.openCriticalRisks} critical` : undefined}
        />
        <MetricCard
          label="Headcount Attainment"
          value={`${summary.headcountAttainmentPct.toFixed(0)}%`}
          sub="vs plan"
          deltaPositive={summary.headcountAttainmentPct >= 95}
          delta={`${(summary.headcountAttainmentPct - 100).toFixed(1)}%`}
        />
      </div>

      {/* Portfolio heatmap */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Portfolio Health Heatmap</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Framework scores across 7 dimensions · 1=Intervention · 5=Outperforming</p>
        </div>
        <HeatmapTable companies={filteredCompanies} />
      </div>

      {/* Ranking + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Ranking */}
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Portfolio Health Ranking</h2>
          </div>
          <div className="divide-y divide-slate-800/50">
            {sortedByScore.map((company, idx) => (
              <Link
                key={company.slug}
                href={`/company/${company.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors"
              >
                <span className="text-[13px] font-mono text-slate-600 w-4 flex-shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-slate-200">{company.name}</span>
                    <StatusBadge status={company.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {company.sector} · CEO: {company.ceo}
                  </p>
                </div>
                <ScoreChip score={company.frameworkScore.overall} size="md" />
              </Link>
            ))}
          </div>
        </div>

        {/* Trend Charts */}
        <div className="space-y-4">
          <div className="bg-[#161b27] border border-slate-800 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-[14px] font-semibold text-slate-200">Portfolio Revenue Trend</h2>
              <p className="text-[11px] text-slate-500">Combined portfolio actual vs plan ($M)</p>
            </div>
            <div className="p-4">
              <PortfolioTrendChart data={trendData} metric="revenue" />
            </div>
          </div>
          <div className="bg-[#161b27] border border-slate-800 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-[14px] font-semibold text-slate-200">Portfolio EBITDA Trend</h2>
              <p className="text-[11px] text-slate-500">Combined portfolio actual vs plan ($M)</p>
            </div>
            <div className="p-4">
              <PortfolioTrendChart data={trendData} metric="ebitda" />
            </div>
          </div>
        </div>
      </div>

      {/* Attention + Wins */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Where Attention Is Needed</h2>
            <p className="text-[11px] text-slate-500">Escalated risks and execution gaps requiring platform focus</p>
          </div>
          <div className="p-4">
            <AttentionPanel items={attentionItems} />
          </div>
        </div>

        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Platform Wins</h2>
            <p className="text-[11px] text-slate-500">Value creation highlights and outperformance signals</p>
          </div>
          <div className="p-4">
            <PlatformWins wins={platformWins} />
          </div>
        </div>
      </div>

      {/* Weekly review + Executive brief */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Weekly Operating Review</h2>
            <p className="text-[11px] text-slate-500">Recommended discussion topics · Week of Dec 9, 2024</p>
          </div>
          <div className="p-4">
            <WeeklyReviewPanel topics={reviewTopics} />
          </div>
        </div>

        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Executive Brief</h2>
            <p className="text-[11px] text-slate-500">Auto-generated portfolio insights · Q4 2024</p>
          </div>
          <div className="p-4">
            <ExecutiveBrief bullets={executiveBrief} />
          </div>
        </div>
      </div>
    </div>
  );
}
