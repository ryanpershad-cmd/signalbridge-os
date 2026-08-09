// ============================================================================
// Adapter: accounting Firm (+ diagnostics) -> dashboard Company model.
// This reseeds the entire portfolio dashboard onto the accounting-firm roll-up.
// ============================================================================

import {
  Company,
  CompanySlug,
  Sector,
  Status,
  FunctionArea,
  Initiative,
  Risk,
  KPI,
  MonthlyFinancials,
  FrameworkScore,
  FunctionalScore,
  Priority,
} from '@/lib/types';
import { Firm, ServiceLine } from './types';
import { diagnoseFirm, FirmDiagnostic, Initiative as PlanItem } from './diagnostics';
import { LeverKey } from './benchmarks';

const r1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number) => Math.max(1, Math.min(5, x));

const STATUS_MAP: Record<Firm['status'], Status> = {
  platform: 'outperforming',
  performing: 'on-track',
  watch: 'watch',
  turnaround: 'intervention',
};

const SECTOR_MAP: Record<ServiceLine, Sector> = {
  tax: 'Tax & Advisory',
  audit: 'Audit & Assurance',
  cas: 'Client Accounting',
  advisory: 'Advisory & CFO',
};

const LEVER_FUNCTION: Record<LeverKey, FunctionArea> = {
  pricing: 'Finance',
  serviceMix: 'GTM',
  laborModel: 'Operations',
  utilization: 'Operations',
  cashLockup: 'Finance',
  clientPortfolio: 'GTM',
};

const MONTHS = [
  '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
];

function leverScores(diag: FirmDiagnostic): Record<LeverKey, number> {
  const m = {} as Record<LeverKey, number>;
  diag.levers.forEach((l) => (m[l.lever] = l.score));
  return m;
}

function framework(firm: Firm, diag: FirmDiagnostic): FrameworkScore {
  const s = leverScores(diag);
  const trend: FrameworkScore['trend'] =
    firm.status === 'platform' || firm.status === 'performing' ? 'up' : firm.status === 'turnaround' ? 'down' : 'flat';
  return {
    financial: r1(clamp((s.pricing + s.utilization) / 2)),
    growth: r1(clamp(s.serviceMix)),
    operational: r1(clamp((s.utilization + s.cashLockup) / 2)),
    talent: r1(clamp(s.laborModel)),
    customer: r1(clamp(s.clientPortfolio)),
    strategic: r1(clamp(diag.overallScore)),
    risk: r1(clamp(diag.weakestLevers[0]?.score ?? diag.overallScore)),
    overall: r1(clamp(diag.overallScore)),
    trend,
  };
}

function functionalScores(firm: Firm, diag: FirmDiagnostic): FunctionalScore[] {
  const s = leverScores(diag);
  const trend: FunctionalScore['trend'] = firm.status === 'turnaround' ? 'down' : 'up';
  return [
    { function: 'GTM', score: r1(clamp((s.serviceMix + s.clientPortfolio) / 2)), commentary: 'Advisory cross-sell and client retention.', trend },
    { function: 'Finance', score: r1(clamp((s.pricing + s.cashLockup) / 2)), commentary: 'Realization discipline and working-capital lockup.', trend },
    { function: 'Operations', score: r1(clamp(s.utilization)), commentary: 'Scheduling, utilization and delivery capacity.', trend },
    { function: 'People', score: r1(clamp(s.laborModel)), commentary: 'Leverage model and offshore delivery mix.', trend },
    { function: 'Technology', score: r1(clamp((s.utilization + diag.overallScore) / 2)), commentary: 'Practice-management and workflow tooling.', trend },
  ];
}

function monthly(firm: Firm): MonthlyFinancials[] {
  const margin = firm.metrics.ebitdaMarginPct;
  const attain = firm.status === 'platform' ? 1.02 : firm.status === 'performing' ? 0.99 : firm.status === 'watch' ? 0.94 : 0.88;
  return firm.monthlyRevenue.map((mm) => {
    const revenue = r1(mm.revenue);
    const revenuePlan = r1(revenue / attain);
    const ebitda = Math.round(revenue * (margin / 100) * 100) / 100;
    const ebitdaPlan = Math.round(revenuePlan * ((margin + 4) / 100) * 100) / 100;
    return {
      month: mm.month,
      revenue,
      revenuePlan,
      ebitda,
      ebitdaPlan,
      ebitdaMargin: r1(margin),
      cashConversion: Math.round(firm.metrics.lockupDays),
      workingCapitalDays: Math.round(firm.metrics.lockupDays),
    };
  });
}

function kpis(firm: Firm): KPI[] {
  const m = firm.metrics;
  const defs: { id: string; name: string; value: number; target: number; unit: string; higher: boolean; desc: string }[] = [
    { id: 'realization', name: 'Realization', value: m.realizationPct, target: 92, unit: '%', higher: true, desc: 'Realized fees vs standard rates.' },
    { id: 'utilization', name: 'Utilization', value: m.utilizationPct, target: 78, unit: '%', higher: true, desc: 'Billed vs available hours.' },
    { id: 'advisory-mix', name: 'Advisory + CAS Mix', value: m.advisoryMixPct, target: 45, unit: '%', higher: true, desc: 'Share of revenue from advisory + client accounting.' },
    { id: 'effective-rate', name: 'Effective Rate', value: m.effectiveRate, target: 245, unit: '$/hr', higher: true, desc: 'Realized fees per billed hour.' },
    { id: 'lockup', name: 'Lockup Days', value: m.lockupDays, target: 55, unit: 'days', higher: false, desc: 'WIP + AR days tied up in working capital.' },
    { id: 'retention', name: 'Net Client Retention', value: m.netClientRetentionPct, target: 98, unit: '%', higher: true, desc: 'Net revenue retention across the client base.' },
  ];
  return defs.map((d) => {
    const behind = d.higher ? d.value < d.target : d.value > d.target;
    const trend = behind ? (d.higher ? 'down' : 'up') : 'up';
    const start = d.higher ? d.value * 0.94 : d.value * 1.06;
    const history = MONTHS.map((mo, i) => ({ month: mo, value: Math.round((start + (d.value - start) * (i / 11)) * 10) / 10 }));
    return {
      id: `${firm.slug}-${d.id}`,
      name: d.name,
      value: Math.round(d.value * 10) / 10,
      target: d.target,
      unit: d.unit,
      trend: trend as KPI['trend'],
      history,
      description: d.desc,
    };
  });
}

function addMonths(iso: string, months: number): string {
  const d = new Date('2024-12-09');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const IMPACT_PRIORITY = (v: number): Priority => (v >= 0.5 ? 'critical' : v >= 0.2 ? 'high' : v >= 0.08 ? 'medium' : 'low');

function initiatives(firm: Firm, plan: PlanItem[]): Initiative[] {
  return plan.map((i, n) => {
    let status: Initiative['status'] = 'not-started';
    let progress = 0;
    if (firm.integrationStage === 'integrated') {
      status = n === 0 ? 'complete' : n <= 2 ? 'on-track' : 'not-started';
    } else if (firm.integrationStage === 'first-100') {
      status = n === 0 ? 'on-track' : 'not-started';
    }
    if (status === 'complete') progress = 100;
    else if (status === 'on-track') progress = 45 + ((n * 7) % 25);
    return {
      id: `${firm.slug}-init-${n + 1}`,
      companySlug: firm.slug as CompanySlug,
      companyName: firm.name,
      title: i.title,
      description: i.thesis,
      function: LEVER_FUNCTION[i.lever],
      owner: i.owner,
      priority: IMPACT_PRIORITY(i.ebitdaImpact),
      status,
      dueDate: addMonths(firm.acquisitionDate, i.timeframeMonths),
      startDate: '2024-10-01',
      progress,
      expectedImpact: `+$${i.ebitdaImpact.toFixed(2)}M EBITDA/yr` + (i.cashReleased > 0 ? ` · +$${i.cashReleased.toFixed(1)}M cash` : ''),
      estimatedValue: i.ebitdaImpact,
      confidenceLevel: i.effort === 'low' ? 'high' : i.effort === 'medium' ? 'medium' : 'low',
      milestones: i.firstActions.map((a, k) => ({ title: a, date: addMonths(firm.acquisitionDate, Math.max(1, Math.round((i.timeframeMonths * (k + 1)) / (i.firstActions.length + 1)))), complete: status === 'complete' })),
      notes: `Lever: ${i.leverLabel}. KPIs: ${i.kpis.join(', ')}.`,
    };
  });
}

function risks(firm: Firm, diag: FirmDiagnostic): Risk[] {
  const weak = diag.levers.filter((l) => l.score < 3).slice(0, 3);
  return weak.map((l, n) => {
    const severity: Risk['severity'] = l.score < 1.5 ? 'critical' : l.score < 2.3 ? 'high' : 'medium';
    const top = diag.initiatives.find((i) => i.lever === l.lever);
    return {
      id: `${firm.slug}-risk-${n + 1}`,
      companySlug: firm.slug as CompanySlug,
      companyName: firm.name,
      title: `${l.label} below platform standard`,
      description: `${l.label} scores ${l.score.toFixed(1)}/5 — ${l.metrics.map((m) => `${m.label} ${Math.round(m.value)}${m.unit === '%' ? '%' : ''}`).join(', ')}.`,
      severity,
      likelihood: l.score < 2 ? 'high' : 'medium',
      owner: top?.owner ?? firm.leadership[0]?.name ?? 'Operating Partner',
      mitigationPlan: top ? top.title : 'Diagnostic initiative in planning.',
      escalated: severity === 'critical',
      daysOpen: 20 + n * 15,
      nextReviewDate: addMonths(firm.acquisitionDate, 1),
      status: firm.integrationStage === 'diligence' ? 'open' : 'mitigating',
      function: LEVER_FUNCTION[l.lever],
    };
  });
}

export function firmToCompany(firm: Firm): Company {
  const diag = diagnoseFirm(firm);
  const dominant = [...firm.serviceLines].sort((a, b) => b.revenue - a.revenue)[0].line;
  const plan = diag.initiatives;
  const onshore = firm.fte - firm.partners;
  return {
    slug: firm.slug as CompanySlug,
    name: firm.name,
    sector: SECTOR_MAP[dominant],
    description: `${firm.hq} · founded ${firm.founded} · ${firm.focus}. ${firm.fte} FTE across ${firm.partners} partners on ${firm.system.toUpperCase()}.`,
    investmentThesis: `Drive ${firm.name} from a ${diag.overallScore.toFixed(1)}/5 benchmark to platform standard — ${diag.weakestLevers.map((l) => l.label.toLowerCase()).slice(0, 3).join(', ')} — for ~$${diag.totalEbitdaUplift.toFixed(1)}M of recurring EBITDA uplift (+$${diag.evCreated.toFixed(1)}M enterprise value at ${firm.entryMultiple}x).`,
    ceo: firm.leadership[0]?.name ?? 'Managing Partner',
    holdPeriodStart: firm.acquisitionDate,
    targetHoldPeriod: '4-6 years',
    entryEBITDA: Math.round(firm.metrics.ebitda * 0.85 * 10) / 10,
    targetMOIC: Math.round((diag.potentialEbitda / Math.max(0.1, firm.metrics.ebitda * 0.85)) * 1.4 * 10) / 10,
    status: STATUS_MAP[firm.status],
    monthlyFinancials: monthly(firm),
    kpis: kpis(firm),
    initiatives: initiatives(firm, plan),
    risks: risks(firm, diag),
    leadership: firm.leadership.map((l) => ({ role: l.role, name: l.name, tenureMonths: 24, filled: true })),
    headcount: {
      total: firm.fte,
      plan: Math.round(firm.fte * 1.06),
      openRoles: Math.max(2, Math.round(firm.fte * 0.05)),
      recentHires: Math.round(firm.fte * 0.04),
      attritionRisk: framework(firm, diag).talent < 3 ? 'high' : framework(firm, diag).talent < 4 ? 'medium' : 'low',
      keyOpenRoles: ['Advisory Manager', 'Offshore Team Lead', 'Billing & Realization Analyst'],
    },
    frameworkScore: framework(firm, diag),
    functionalScores: functionalScores(firm, diag),
    commentary: [
      { date: '2024-12-06', author: firm.leadership[0]?.name ?? 'MP', role: 'Managing Partner', type: 'weekly', text: `Ingestion normalized. Focus this quarter: ${plan[0]?.title ?? 'realization reset'}.` },
      { date: '2024-11-22', author: 'Operating Partner', role: 'SignalBridge', type: firm.status === 'turnaround' ? 'alert' : 'win', text: `Diagnostic complete — ${diag.totalEbitdaUplift.toFixed(1)}M EBITDA opportunity identified across ${plan.length} initiatives.` },
    ],
    recommendedActions: plan.slice(0, 3).map((i) => `${i.title} (${i.leverLabel}, +$${i.ebitdaImpact.toFixed(2)}M)`),
    benchmarkVsPortfolio: {
      Realization: firm.metrics.realizationPct,
      Utilization: firm.metrics.utilizationPct,
      'Advisory Mix': firm.metrics.advisoryMixPct,
      'EBITDA Margin': firm.metrics.ebitdaMarginPct,
      'Lockup Days': firm.metrics.lockupDays,
      Offshore: firm.metrics.offshorePct,
    },
  };
  void onshore;
}
