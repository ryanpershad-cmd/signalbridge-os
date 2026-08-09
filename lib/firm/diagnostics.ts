// ============================================================================
// SignalBridge OS — Diagnostic & value-creation planning engine (Stage 2)
// ----------------------------------------------------------------------------
// Takes a normalized Firm (Stage 1 output), benchmarks every operating metric,
// finds where the firm sits below the platform standard, and turns each gap
// into a costed value-creation initiative with an estimated recurring EBITDA
// impact. The $ model is deterministic and fully auditable — every number is
// derived from the firm's own ledger metrics and the tunable constants below,
// never from a black box. The LLM layer (via /api/chat) narrates the plan; the
// dollars come from here.
// ============================================================================

import { Firm } from './types';
import {
  BENCHMARKS,
  BENCHMARKS_BY_KEY,
  LEVER_LABELS,
  LeverKey,
  MetricKey,
  scoreMetric,
  metricGap,
} from './benchmarks';

// ----------------------------------------------------------------------------
// Tunable model constants. Capture = the share of a gap we underwrite closing
// within the plan horizon (deliberately conservative). Flow-through = the share
// of incremental revenue that reaches EBITDA after delivery cost.
// ----------------------------------------------------------------------------
export const MODEL = {
  captureRealization: 0.5,
  captureMix: 0.4,
  captureOffshore: 0.5,
  captureUtilization: 0.5,
  captureLockup: 0.6,
  captureRetention: 0.5,
  flowThroughPricing: 0.85,
  flowThroughUtilization: 0.6,
  carryRateOnCash: 0.08,
  advisoryMargin: 68, // LINE_MARGIN.advisory
  complianceMargin: 48, // blended tax/audit/cas baseline
} as const;

export type Effort = 'low' | 'medium' | 'high';

const EFFORT_WEIGHT: Record<Effort, number> = { low: 1, medium: 1.6, high: 2.4 };

export interface Initiative {
  id: string;
  firmSlug: string;
  title: string;
  lever: LeverKey;
  leverLabel: string;
  thesis: string;
  metricKey: MetricKey;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  /** Recurring annual EBITDA uplift, $M. */
  ebitdaImpact: number;
  /** One-time cash released (working capital), $M. 0 for most levers. */
  cashReleased: number;
  effort: Effort;
  timeframeMonths: number;
  owner: string;
  /** Impact per unit of effort — used to rank the plan. */
  priorityScore: number;
  kpis: string[];
  firstActions: string[];
}

export interface LeverMetric {
  key: MetricKey;
  label: string;
  value: number;
  target: number;
  unit: string;
  score: number;
  behind: boolean;
}

export interface LeverDiagnostic {
  lever: LeverKey;
  label: string;
  score: number;
  metrics: LeverMetric[];
}

export interface FirmDiagnostic {
  firmSlug: string;
  firmName: string;
  overallScore: number;
  currentEbitda: number;
  potentialEbitda: number;
  totalEbitdaUplift: number;
  cashUnlocked: number;
  entryMultiple: number;
  evCreated: number;
  marginBeforePct: number;
  marginAfterPct: number;
  levers: LeverDiagnostic[];
  weakestLevers: LeverDiagnostic[];
  initiatives: Initiative[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

/** How far a metric sits on the wrong side of its target (in metric units). */
function deficit(key: MetricKey, value: number): number {
  return Math.max(0, -metricGap(key, value));
}

function target(key: MetricKey): number {
  return BENCHMARKS_BY_KEY[key].target;
}

// ----------------------------------------------------------------------------
// Build the lever view: every benchmark grouped under the value lever it informs.
// ----------------------------------------------------------------------------
function buildLevers(firm: Firm): LeverDiagnostic[] {
  const byLever = new Map<LeverKey, LeverMetric[]>();
  for (const b of BENCHMARKS) {
    const value = firm.metrics[b.key];
    const score = scoreMetric(b.key, value);
    const entry: LeverMetric = {
      key: b.key,
      label: b.label,
      value,
      target: b.target,
      unit: b.unit,
      score,
      behind: metricGap(b.key, value) < 0,
    };
    const list = byLever.get(b.lever) ?? [];
    list.push(entry);
    byLever.set(b.lever, list);
  }

  const levers: LeverDiagnostic[] = [];
  for (const [lever, metrics] of byLever) {
    const score = r1(metrics.reduce((a, x) => a + x.score, 0) / metrics.length);
    levers.push({ lever, label: LEVER_LABELS[lever], score, metrics });
  }
  return levers.sort((a, b) => a.score - b.score);
}

// ----------------------------------------------------------------------------
// Initiative generators — one per lever, each keyed off the real metric gap.
// ----------------------------------------------------------------------------
function buildInitiatives(firm: Firm): Initiative[] {
  const m = firm.metrics;
  const R = m.revenueLTM;
  const tb = firm.raw.timeAndBilling;
  const onshore = firm.raw.staff.find((s) => s.location === 'onshore' && s.role === 'staff');
  const offshore = firm.raw.staff.find((s) => s.location === 'offshore');
  const onshoreComp = onshore?.compAnnual ?? 95000;
  const offshoreComp = offshore?.compAnnual ?? 28000;

  const out: Initiative[] = [];

  const add = (
    i: Omit<Initiative, 'firmSlug' | 'leverLabel' | 'metricLabel' | 'unit' | 'priorityScore' | 'targetValue'> & {
      lever: LeverKey;
      metricKey: MetricKey;
    }
  ) => {
    const bench = BENCHMARKS_BY_KEY[i.metricKey];
    out.push({
      ...i,
      firmSlug: firm.slug,
      leverLabel: LEVER_LABELS[i.lever],
      metricLabel: bench.label,
      unit: bench.unit,
      targetValue: bench.target,
      priorityScore: r2((i.ebitdaImpact / EFFORT_WEIGHT[i.effort]) * 100),
    });
  };

  // 1) Pricing & realization -------------------------------------------------
  const realDef = deficit('realizationPct', m.realizationPct);
  if (realDef >= 1) {
    const capturedPP = realDef * MODEL.captureRealization;
    const incRev = tb.standardFees * (capturedPP / 100);
    const impact = r2(incRev * MODEL.flowThroughPricing);
    add({
      id: `${firm.slug}-realizationPct`,
      title: 'Rate-card reset & realization recovery',
      lever: 'pricing',
      metricKey: 'realizationPct',
      currentValue: m.realizationPct,
      thesis:
        `Realization is running ${m.realizationPct.toFixed(0)}% against a ${target('realizationPct')}% platform standard. ` +
        `Resetting the rate card, tightening scope-creep write-offs, and moving legacy fixed fees to value-based pricing ` +
        `recovers roughly ${capturedPP.toFixed(1)}pts of realization on $${tb.standardFees.toFixed(1)}M of standard fees.`,
      ebitdaImpact: impact,
      cashReleased: 0,
      effort: 'medium',
      timeframeMonths: 6,
      owner: 'Pricing & Billing Lead',
      kpis: ['Realization %', 'Effective rate ($/hr)', 'Write-off %', 'Fixed-fee → value-priced %'],
      firstActions: [
        'Pull the trailing-12 write-off and write-down report by partner and client',
        'Re-rate the top 50 clients to the new standard card and flag legacy discounts',
        'Introduce a scope-change / out-of-scope billing protocol for delivery teams',
      ],
    });
  }

  // 2) Service-mix shift to advisory ----------------------------------------
  const advDef = deficit('advisoryMixPct', m.advisoryMixPct);
  if (advDef >= 1) {
    const capturedPP = advDef * MODEL.captureMix;
    const revShifted = R * (capturedPP / 100);
    const impact = r2(revShifted * ((MODEL.advisoryMargin - MODEL.complianceMargin) / 100));
    add({
      id: `${firm.slug}-advisoryMixPct`,
      title: 'Advisory & CAS cross-sell build-out',
      lever: 'serviceMix',
      metricKey: 'advisoryMixPct',
      currentValue: m.advisoryMixPct,
      thesis:
        `Advisory + CAS is ${m.advisoryMixPct.toFixed(0)}% of revenue vs a ${target('advisoryMixPct')}% target. ` +
        `Converting compliance relationships into recurring advisory and client-accounting engagements shifts about ` +
        `$${revShifted.toFixed(1)}M of revenue into ~${MODEL.advisoryMargin}%-margin work, well above the ~${MODEL.complianceMargin}% compliance baseline.`,
      ebitdaImpact: impact,
      cashReleased: 0,
      effort: 'high',
      timeframeMonths: 12,
      owner: 'Head of Advisory',
      kpis: ['Advisory + CAS mix %', 'Recurring revenue %', 'Advisory attach rate', 'Avg revenue / client'],
      firstActions: [
        'Segment the compliance book for advisory / CAS conversion potential',
        'Package 2–3 productized advisory offers (CFO, forecasting, tax planning)',
        'Set partner-level cross-sell targets into the compensation plan',
      ],
    });
  }

  // 3) Labor model & offshore -----------------------------------------------
  const offDef = deficit('offshorePct', m.offshorePct);
  if (offDef >= 1) {
    const capturedPP = offDef * MODEL.captureOffshore;
    const fteShifted = firm.fte * (capturedPP / 100);
    const impact = r2((fteShifted * (onshoreComp - offshoreComp)) / 1_000_000);
    add({
      id: `${firm.slug}-offshorePct`,
      title: 'Offshore delivery expansion',
      lever: 'laborModel',
      metricKey: 'offshorePct',
      currentValue: m.offshorePct,
      thesis:
        `Offshore mix is ${m.offshorePct.toFixed(0)}% vs a ${target('offshorePct')}% platform target. ` +
        `Migrating ~${fteShifted.toFixed(0)} FTE of standardized prep and bookkeeping to the offshore center ` +
        `saves roughly $${(onshoreComp - offshoreComp).toLocaleString()} of fully-loaded cost per seat.`,
      ebitdaImpact: impact,
      cashReleased: 0,
      effort: 'high',
      timeframeMonths: 12,
      owner: 'COO / Delivery Lead',
      kpis: ['Offshore mix %', 'Revenue / FTE', 'Leverage ratio', 'Offshore quality/rework rate'],
      firstActions: [
        'Map which workpapers and prep steps are offshore-ready today',
        'Stand up the pod structure and onshore review handoffs',
        'Set a hiring ramp and 90-day quality gate for the offshore team',
      ],
    });
  }

  // 4) Utilization & capacity -----------------------------------------------
  const utilDef = deficit('utilizationPct', m.utilizationPct);
  if (utilDef >= 1) {
    const capturedPP = utilDef * MODEL.captureUtilization;
    const incHours = tb.availableHours * (capturedPP / 100);
    const incRev = (incHours * m.effectiveRate) / 1_000_000;
    const impact = r2(incRev * MODEL.flowThroughUtilization);
    add({
      id: `${firm.slug}-utilizationPct`,
      title: 'Utilization & capacity uplift',
      lever: 'utilization',
      metricKey: 'utilizationPct',
      currentValue: m.utilizationPct,
      thesis:
        `Utilization is ${m.utilizationPct.toFixed(0)}% vs a ${target('utilizationPct')}% target. ` +
        `Better scheduling, WIP visibility, and off-season work-smoothing frees roughly ${Math.round(incHours).toLocaleString()} ` +
        `billable hours at a $${Math.round(m.effectiveRate)}/hr effective rate.`,
      ebitdaImpact: impact,
      cashReleased: 0,
      effort: 'medium',
      timeframeMonths: 9,
      owner: 'Resource Management Lead',
      kpis: ['Utilization %', 'Billable hours', 'Bench %', 'Realized effective rate'],
      firstActions: [
        'Stand up a single firm-wide scheduling and capacity board',
        'Shift recurring CAS / advisory work into the off-season troughs',
        'Set weekly utilization targets by team with manager accountability',
      ],
    });
  }

  // 5) Cash & lockup ---------------------------------------------------------
  const lockExcess = deficit('lockupDays', m.lockupDays);
  if (lockExcess >= 3) {
    const capturedDays = lockExcess * MODEL.captureLockup;
    const cash = r2((capturedDays / 365) * R);
    const impact = r2(cash * MODEL.carryRateOnCash);
    add({
      id: `${firm.slug}-lockupDays`,
      title: 'Lockup reduction (WIP + AR)',
      lever: 'cashLockup',
      metricKey: 'lockupDays',
      currentValue: m.lockupDays,
      thesis:
        `Lockup sits at ${Math.round(m.lockupDays)} days vs a ${target('lockupDays')}-day target. ` +
        `Faster billing cycles and disciplined collections pull ~${capturedDays.toFixed(0)} days out of working capital — ` +
        `about $${cash.toFixed(1)}M of one-time cash, plus recurring carry at ${(MODEL.carryRateOnCash * 100).toFixed(0)}%.`,
      ebitdaImpact: impact,
      cashReleased: cash,
      effort: 'low',
      timeframeMonths: 4,
      owner: 'Finance / Controller',
      kpis: ['Lockup days', 'WIP days', 'AR days', 'AR > 90 days $'],
      firstActions: [
        'Move to bill-on-completion (or interim billing) for long-cycle engagements',
        'Launch a 30/60/90 AR collections cadence with partner escalation',
        'Set WIP write-up/write-down review at every month close',
      ],
    });
  }

  // 6) Client portfolio (retention) -----------------------------------------
  const retDef = deficit('netClientRetentionPct', m.netClientRetentionPct);
  if (retDef >= 1) {
    const capturedPP = retDef * MODEL.captureRetention;
    const revProtected = R * (capturedPP / 100);
    const impact = r2(revProtected * (m.ebitdaMarginPct / 100));
    add({
      id: `${firm.slug}-netClientRetentionPct`,
      title: 'Client retention & concentration program',
      lever: 'clientPortfolio',
      metricKey: 'netClientRetentionPct',
      currentValue: m.netClientRetentionPct,
      thesis:
        `Net client retention is ${m.netClientRetentionPct.toFixed(0)}% vs a ${target('netClientRetentionPct')}% target, ` +
        `with top-10 concentration at ${m.top10ClientPct.toFixed(0)}%. A structured relationship program protects roughly ` +
        `$${revProtected.toFixed(1)}M of at-risk recurring revenue and de-risks the concentration on exit.`,
      ebitdaImpact: impact,
      cashReleased: 0,
      effort: 'medium',
      timeframeMonths: 9,
      owner: 'Client Experience Lead',
      kpis: ['Net client retention %', 'Logo churn', 'Top-10 concentration %', 'NPS / relationship score'],
      firstActions: [
        'Assign executive sponsors to every top-25 relationship',
        'Instrument an early-warning churn signal from billing and engagement data',
        'Build a diversification pipeline to dilute top-10 concentration',
      ],
    });
  }

  return out.sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Full diagnostic for one firm. */
export function diagnoseFirm(firm: Firm): FirmDiagnostic {
  const levers = buildLevers(firm);
  const initiatives = buildInitiatives(firm);

  const overallScore = r1(
    BENCHMARKS.reduce((a, b) => a + scoreMetric(b.key, firm.metrics[b.key]), 0) / BENCHMARKS.length
  );

  const totalEbitdaUplift = r2(initiatives.reduce((a, i) => a + i.ebitdaImpact, 0));
  const cashUnlocked = r2(initiatives.reduce((a, i) => a + i.cashReleased, 0));
  const currentEbitda = r2(firm.metrics.ebitda);
  const potentialEbitda = r2(currentEbitda + totalEbitdaUplift);
  const evCreated = r2(totalEbitdaUplift * firm.entryMultiple);
  const marginBeforePct = r1(firm.metrics.ebitdaMarginPct);
  const marginAfterPct = firm.metrics.revenueLTM
    ? r1((potentialEbitda / firm.metrics.revenueLTM) * 100)
    : marginBeforePct;

  return {
    firmSlug: firm.slug,
    firmName: firm.name,
    overallScore,
    currentEbitda,
    potentialEbitda,
    totalEbitdaUplift,
    cashUnlocked,
    entryMultiple: firm.entryMultiple,
    evCreated,
    marginBeforePct,
    marginAfterPct,
    levers,
    weakestLevers: levers.slice(0, 3),
    initiatives,
  };
}

/** Diagnose the whole portfolio. */
export function diagnosePortfolio(firms: Firm[]): FirmDiagnostic[] {
  return firms.map(diagnoseFirm);
}

/** A compact text brief for the LLM memo layer (reuses /api/chat). */
export function buildDiagnosticBrief(firm: Firm, diag: FirmDiagnostic): string {
  const lines: string[] = [];
  lines.push(`FIRM: ${firm.name} (${firm.hq}) — acquired ${firm.acquisitionDate} at ${firm.entryMultiple}x`);
  lines.push(`Revenue LTM $${firm.metrics.revenueLTM.toFixed(1)}M | EBITDA $${diag.currentEbitda.toFixed(1)}M (${diag.marginBeforePct}%)`);
  lines.push(`Overall benchmark score: ${diag.overallScore}/5`);
  lines.push('');
  lines.push('WEAKEST VALUE LEVERS:');
  for (const l of diag.weakestLevers) {
    lines.push(`  - ${l.label}: ${l.score}/5`);
  }
  lines.push('');
  lines.push(`VALUE-CREATION PLAN — ${diag.totalEbitdaUplift.toFixed(1)}M recurring EBITDA uplift, ` +
    `$${diag.cashUnlocked.toFixed(1)}M one-time cash, ~$${diag.evCreated.toFixed(1)}M enterprise value at entry multiple:`);
  diag.initiatives.forEach((i, n) => {
    lines.push(
      `  ${n + 1}. ${i.title} [${i.leverLabel}] — +$${i.ebitdaImpact.toFixed(2)}M EBITDA, ` +
        `${i.effort} effort, ${i.timeframeMonths}mo. ${i.metricLabel}: ${i.currentValue.toFixed(1)} → ${i.targetValue} ${i.unit}.`
    );
  });
  return lines.join('\n');
}
