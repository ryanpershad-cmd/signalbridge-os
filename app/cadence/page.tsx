'use client';

import { companies } from '@/lib/data';
import { getWeeklyReviewTopics } from '@/lib/aggregations';
import WeeklyAgenda from '@/components/cadence/WeeklyAgenda';
import UpcomingMilestones from '@/components/cadence/UpcomingMilestones';
import CommentaryFeed from '@/components/company/CommentaryFeed';
import { Commentary } from '@/lib/types';

export default function CadencePage() {
  const weeklyTopics = getWeeklyReviewTopics(companies);

  // Aggregate all recent commentary across portfolio, sorted by date
  const allCommentary: (Commentary & { companyName: string })[] = companies
    .flatMap(c => c.commentary.map(cm => ({ ...cm, companyName: c.name })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  // Key decisions pending
  const keyDecisions = [
    {
      company: 'Apex Health',
      decision: 'Approve 12-15% clinician compensation adjustment to reduce turnover in Dallas, Charlotte, and Atlanta markets',
      owner: 'Dr. Rebecca Fontes, CEO',
      deadline: 'Jan 1, 2025',
      urgency: 'critical',
    },
    {
      company: 'BluePeak Software',
      decision: 'Approve engineering total comp increase (15-20%) and evaluate Austin/Toronto hub opening to solve talent gap',
      owner: 'Jenna Park, CEO',
      deadline: 'Jan 15, 2025',
      urgency: 'high',
    },
    {
      company: 'Harbor Home Services',
      decision: 'Lock membership program pricing ($199 vs $229) and commit to January 1 soft launch — no further delays',
      owner: 'Chris Alderman, CEO',
      deadline: 'Dec 15, 2024',
      urgency: 'critical',
    },
    {
      company: 'Vertex Logistics',
      decision: 'CEO direct outreach to Southeast Foods Group procurement team to unlock Prospect A dedicated contract execution',
      owner: 'Robert Kaczmarek, CEO',
      deadline: 'Dec 20, 2024',
      urgency: 'high',
    },
    {
      company: 'Northstar Foods',
      decision: 'Authorize protein bar launch pre-sell for Q1 — Whole Foods Dec 8 meeting outcome to determine timing',
      owner: 'Marcus Tillman, CEO',
      deadline: 'Dec 20, 2024',
      urgency: 'medium',
    },
  ];

  // Monthly review template items
  const monthlyReviewItems = [
    { section: 'Financial Performance', items: ['Revenue vs plan (MTD and YTD)', 'EBITDA vs plan and margin trend', 'Cash position and DSO', 'Working capital vs target'] },
    { section: 'KPI Exceptions', items: ['KPIs more than 5% below target', 'KPIs showing 2+ months of deterioration', 'New leading indicator concerns'] },
    { section: 'Initiatives Review', items: ['Overdue initiatives — root cause and reset plan', 'At-risk initiatives — recovery actions', 'Recently completed — impact confirmation'] },
    { section: 'Risks & Escalations', items: ['New risks identified since last review', 'Risk status updates (open, mitigating, resolved)', 'Escalated items requiring GP decision'] },
    { section: 'Talent & Organization', items: ['Key open roles and search status', 'Recent departures and succession plan', 'Compensation or culture concerns'] },
    { section: 'Upcoming 30 Days', items: ['Key milestones due', 'Board or key customer meetings', 'Decisions required from GP'] },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Operating Cadence</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Weekly reviews, milestones, and operating rhythm · Dec 9, 2024</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Weekly Business Review */}
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Weekly Business Review Agenda</h2>
            <p className="text-[11px] text-slate-500">Week of December 9, 2024 · Data-driven agenda</p>
          </div>
          <div className="p-5">
            <WeeklyAgenda topics={weeklyTopics} />
          </div>
        </div>

        {/* Key Decisions Pending */}
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-200">Decisions Pending</h2>
            <p className="text-[11px] text-slate-500">Decisions requiring GP or board action</p>
          </div>
          <div className="p-5 space-y-3">
            {keyDecisions.map((dec, idx) => (
              <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-blue-400">{dec.company}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
                      dec.urgency === 'critical' ? 'bg-red-500/15 text-red-400' :
                      dec.urgency === 'high' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-blue-500/15 text-blue-400'
                    }`}>
                      {dec.urgency}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{dec.deadline}</span>
                </div>
                <p className="text-[12px] text-slate-300 leading-relaxed mb-1">{dec.decision}</p>
                <p className="text-[10px] text-slate-600">Owner: {dec.owner}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Upcoming Milestones — Next 60 Days</h2>
          <p className="text-[11px] text-slate-500">Initiative milestones due by Feb 9, 2025</p>
        </div>
        <div className="p-5">
          <UpcomingMilestones companies={companies} />
        </div>
      </div>

      {/* Monthly operating review template */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Monthly Operating Review Template</h2>
          <p className="text-[11px] text-slate-500">Standard agenda for monthly portfolio company reviews</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {monthlyReviewItems.map((section, idx) => (
              <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {idx + 1}. {section.section}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-[11px] text-slate-500">
                      <span className="text-slate-700 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meeting notes / Commentary feed */}
      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Recent Operating Notes</h2>
          <p className="text-[11px] text-slate-500">Portfolio-wide commentary feed — last 3 weeks</p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {allCommentary.slice(0, 8).map((item, idx) => (
              <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-blue-400">{item.companyName}</span>
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className="text-[11px] text-slate-400">{item.author}</span>
                    <span className="text-[10px] text-slate-500">{item.role}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
                      item.type === 'win' ? 'bg-green-500/15 text-green-400' :
                      item.type === 'alert' ? 'bg-red-500/15 text-red-400' :
                      item.type === 'monthly' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-slate-700/50 text-slate-500'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{item.date}</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
