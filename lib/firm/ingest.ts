// ============================================================================
// Ingestion engine
// ----------------------------------------------------------------------------
// A compact FirmSeed (what an analyst knows about an acquisition) is expanded
// into a synthesized RawLedgerPull — the same shape a QuickBooks / Karbon / CCH
// connector would return — and then normalized into a common FirmMetrics profile.
// Swapping the synthesizer for a real API client is a drop-in change; the
// normalizer downstream never changes.
// ============================================================================

import {
  AccountingSystem,
  Firm,
  FirmMetrics,
  FirmStatus,
  IntegrationStage,
  LeadershipMember,
  RawLedgerPull,
  ServiceLine,
  ServiceLineSummary,
} from './types';

const MONTHS = [
  '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
];

// Per-line monthly seasonality profiles (Jan..Dec). Tax spikes hard in busy
// season; audit leans Q1; CAS and advisory are close to flat / recurring.
const LINE_SEASONALITY: Record<ServiceLine, number[]> = {
  tax:      [1.7, 1.9, 2.4, 2.2, 0.5, 0.4, 0.5, 0.5, 0.7, 0.7, 0.6, 0.5],
  audit:    [1.6, 1.7, 1.8, 1.5, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 0.7, 0.5],
  cas:      [1.05, 1.0, 1.05, 1.0, 0.98, 0.97, 0.98, 0.99, 1.0, 1.0, 0.99, 0.99],
  advisory: [1.0, 0.95, 1.05, 1.0, 1.02, 1.0, 0.98, 0.97, 1.03, 1.05, 1.0, 0.95],
};

const LINE_MARGIN: Record<ServiceLine, number> = {
  tax: 55,
  audit: 42,
  cas: 48,
  advisory: 68,
};

export interface FirmSeed {
  slug: string;
  name: string;
  hq: string;
  founded: number;
  focus: string;
  system: AccountingSystem;
  acquisitionDate: string;
  entryMultiple: number;
  ownershipPct: number;
  status: FirmStatus;
  integrationStage: IntegrationStage;
  accentColor: string;
  revenueLTM: number; // $M
  ebitdaMarginPct: number;
  mix: Record<ServiceLine, number>; // shares, sum ~1
  recurring: Record<ServiceLine, number>; // recurring % per line
  partners: number;
  fte: number;
  offshoreFte: number;
  realizationPct: number;
  utilizationPct: number;
  wip: number; // $M
  ar: number; // $M
  arOver90: number; // $M
  clientCount: number;
  top10ClientPct: number;
  churnedLTM: number;
  addedLTM: number;
  netRetentionPct: number;
  partnerComp: number; // $ avg
  onshoreComp: number; // $ avg staff
  offshoreComp: number; // $ avg staff
  leadership: LeadershipMember[];
}

function normalizeProfile(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

/** Expand a seed into the raw pull a connector would hand us. */
export function synthesizeRawPull(seed: FirmSeed): RawLedgerPull {
  const lines = Object.keys(seed.mix) as ServiceLine[];

  const serviceRevenue = lines.map((line) => {
    const lineRevenue = seed.revenueLTM * seed.mix[line];
    const profile = normalizeProfile(LINE_SEASONALITY[line]);
    return {
      line,
      monthly: profile.map((p) => Math.round(lineRevenue * p * 1000) / 1000),
      recurringPct: seed.recurring[line],
    };
  });

  const availableHours = Math.round(seed.fte * 1600);
  const billedHours = Math.round(availableHours * (seed.utilizationPct / 100));
  const realizedFees = seed.revenueLTM;
  const standardFees = Math.round((realizedFees / (seed.realizationPct / 100)) * 100) / 100;
  const effectiveRate = (realizedFees * 1_000_000) / billedHours;
  const blendedStandardRate = effectiveRate / (seed.realizationPct / 100);

  const onshoreStaff = seed.fte - seed.partners - seed.offshoreFte;
  const staff = [
    { role: 'partner' as const, fte: seed.partners, location: 'onshore' as const, compAnnual: seed.partnerComp },
    { role: 'staff' as const, fte: Math.max(0, onshoreStaff), location: 'onshore' as const, compAnnual: seed.onshoreComp },
    { role: 'staff' as const, fte: seed.offshoreFte, location: 'offshore' as const, compAnnual: seed.offshoreComp },
  ].filter((r) => r.fte > 0);

  return {
    source: seed.system,
    pulledAt: '2024-12-09',
    serviceRevenue,
    timeAndBilling: {
      availableHours,
      billedHours,
      standardFees,
      realizedFees,
      blendedStandardRate: Math.round(blendedStandardRate),
    },
    wip: seed.wip,
    ar: seed.ar,
    arOver90: seed.arOver90,
    ebitdaMarginPct: seed.ebitdaMarginPct,
    staff,
    clients: {
      count: seed.clientCount,
      top10RevenuePct: seed.top10ClientPct,
      churnedLTM: seed.churnedLTM,
      addedLTM: seed.addedLTM,
    },
  };
}

function buildServiceLines(raw: RawLedgerPull, revenueLTM: number): ServiceLineSummary[] {
  return raw.serviceRevenue.map((sr) => {
    const revenue = Math.round(sr.monthly.reduce((a, b) => a + b, 0) * 1000) / 1000;
    return {
      line: sr.line,
      revenue,
      revenueSharePct: Math.round((revenue / revenueLTM) * 1000) / 10,
      recurringPct: sr.recurringPct,
      grossMarginPct: LINE_MARGIN[sr.line],
    };
  });
}

function buildMonthlyRevenue(raw: RawLedgerPull): { month: string; revenue: number }[] {
  return MONTHS.map((month, i) => {
    const revenue = raw.serviceRevenue.reduce((sum, sr) => sum + (sr.monthly[i] ?? 0), 0);
    return { month, revenue: Math.round(revenue * 1000) / 1000 };
  });
}

/** Normalize a raw pull into the common operating profile. */
export function normalize(raw: RawLedgerPull, seed: FirmSeed): {
  metrics: FirmMetrics;
  serviceLines: ServiceLineSummary[];
  monthlyRevenue: { month: string; revenue: number }[];
} {
  const serviceLines = buildServiceLines(raw, seed.revenueLTM);
  const monthlyRevenue = buildMonthlyRevenue(raw);

  const revenueLTM = Math.round(monthlyRevenue.reduce((a, m) => a + m.revenue, 0) * 1000) / 1000;
  const ebitda = Math.round(revenueLTM * (raw.ebitdaMarginPct / 100) * 1000) / 1000;

  const recurringRevenue = serviceLines.reduce((sum, s) => sum + s.revenue * (s.recurringPct / 100), 0);
  const advisoryRevenue = serviceLines
    .filter((s) => s.line === 'advisory' || s.line === 'cas')
    .reduce((sum, s) => sum + s.revenue, 0);

  const busySeason = monthlyRevenue.slice(0, 4).reduce((a, m) => a + m.revenue, 0);

  const { billedHours, realizedFees } = raw.timeAndBilling;

  const metrics: FirmMetrics = {
    revenueLTM,
    ebitda,
    ebitdaMarginPct: raw.ebitdaMarginPct,
    revenuePerPartner: Math.round((revenueLTM * 1_000_000) / seed.partners),
    revenuePerFTE: Math.round((revenueLTM * 1_000_000) / seed.fte),
    realizationPct: Math.round((realizedFees / raw.timeAndBilling.standardFees) * 1000) / 10,
    utilizationPct: seed.utilizationPct,
    effectiveRate: Math.round((realizedFees * 1_000_000) / billedHours),
    lockupDays: Math.round(((raw.wip + raw.ar) / revenueLTM) * 365),
    wipDays: Math.round((raw.wip / revenueLTM) * 365),
    arDays: Math.round((raw.ar / revenueLTM) * 365),
    leverageRatio: Math.round(((seed.fte - seed.partners) / seed.partners) * 10) / 10,
    offshorePct: Math.round((seed.offshoreFte / seed.fte) * 1000) / 10,
    recurringRevenuePct: Math.round((recurringRevenue / revenueLTM) * 1000) / 10,
    advisoryMixPct: Math.round((advisoryRevenue / revenueLTM) * 1000) / 10,
    top10ClientPct: raw.clients.top10RevenuePct,
    netClientRetentionPct: seed.netRetentionPct,
    seasonalityIndex: Math.round((busySeason / revenueLTM) * 1000) / 10,
  };

  return { metrics, serviceLines, monthlyRevenue };
}

/** Full pipeline: seed -> raw pull -> normalized Firm. */
export function buildFirm(seed: FirmSeed): Firm {
  const raw = synthesizeRawPull(seed);
  const { metrics, serviceLines, monthlyRevenue } = normalize(raw, seed);
  return {
    slug: seed.slug,
    name: seed.name,
    hq: seed.hq,
    founded: seed.founded,
    focus: seed.focus,
    system: seed.system,
    acquisitionDate: seed.acquisitionDate,
    entryMultiple: seed.entryMultiple,
    ownershipPct: seed.ownershipPct,
    status: seed.status,
    integrationStage: seed.integrationStage,
    accentColor: seed.accentColor,
    partners: seed.partners,
    fte: seed.fte,
    raw,
    metrics,
    serviceLines,
    monthlyRevenue,
    leadership: seed.leadership,
  };
}
