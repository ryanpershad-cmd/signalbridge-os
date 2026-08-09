// ============================================================================
// SignalBridge OS — Accounting-firm roll-up domain model
// ----------------------------------------------------------------------------
// This is the model the operating layer runs on. Each acquired firm is ingested
// from its accounting / practice-management system, normalized into a common
// operating profile, and then diagnosed for value-creation gaps.
// ============================================================================

/** The four service lines an accounting firm sells across. */
export type ServiceLine = 'tax' | 'audit' | 'cas' | 'advisory';

export const SERVICE_LINE_LABELS: Record<ServiceLine, string> = {
  tax: 'Tax & Compliance',
  audit: 'Audit & Assurance',
  cas: 'Client Accounting (CAS)',
  advisory: 'Advisory & CFO',
};

/** Source systems the ingestion layer can (simulate a) connect to. */
export type AccountingSystem =
  | 'quickbooks'
  | 'xero'
  | 'sage'
  | 'karbon'
  | 'cch-axcess'
  | 'ultratax'
  | 'csv';

export const SYSTEM_LABELS: Record<AccountingSystem, string> = {
  quickbooks: 'QuickBooks Online',
  xero: 'Xero',
  sage: 'Sage',
  karbon: 'Karbon',
  'cch-axcess': 'CCH Axcess',
  ultratax: 'UltraTax CS',
  csv: 'CSV / Manual Upload',
};

export type FirmRole =
  | 'managing-partner'
  | 'partner'
  | 'director'
  | 'manager'
  | 'senior'
  | 'staff'
  | 'admin';

export type FirmStatus = 'platform' | 'performing' | 'watch' | 'turnaround';

export type IntegrationStage = 'diligence' | 'day-1' | 'first-100' | 'integrated';

export const INTEGRATION_STAGE_LABELS: Record<IntegrationStage, string> = {
  diligence: 'Diligence',
  'day-1': 'Day 1',
  'first-100': 'First 100 Days',
  integrated: 'Integrated',
};

// ----------------------------------------------------------------------------
// Raw pull — what a connector returns *before* normalization. The prototype
// synthesizes this; a real QBO / Karbon / CCH API would populate the same shape.
// ----------------------------------------------------------------------------

export interface RawServiceRevenue {
  line: ServiceLine;
  /** Trailing 12 months of revenue for this line, in $M. */
  monthly: number[];
  recurringPct: number;
}

export interface RawStaffRow {
  role: FirmRole;
  fte: number;
  location: 'onshore' | 'offshore';
  /** Fully-loaded annual comp, in $ (absolute). */
  compAnnual: number;
}

export interface RawLedgerPull {
  source: AccountingSystem;
  /** ISO date the pull ran. */
  pulledAt: string;
  serviceRevenue: RawServiceRevenue[];
  timeAndBilling: {
    availableHours: number;
    billedHours: number;
    /** Standard (rack) fees at list rates, $M. */
    standardFees: number;
    /** Fees actually realized, $M. */
    realizedFees: number;
    blendedStandardRate: number; // $/hr
  };
  /** Work in progress not yet billed, $M. */
  wip: number;
  /** Accounts receivable, $M. */
  ar: number;
  /** Portion of AR aged over 90 days, $M. */
  arOver90: number;
  ebitdaMarginPct: number;
  staff: RawStaffRow[];
  clients: {
    count: number;
    top10RevenuePct: number;
    churnedLTM: number;
    addedLTM: number;
  };
}

// ----------------------------------------------------------------------------
// Normalized operating metrics — the common language across the portfolio.
// ----------------------------------------------------------------------------

export interface FirmMetrics {
  revenueLTM: number; // $M
  ebitda: number; // $M
  ebitdaMarginPct: number;
  revenuePerPartner: number; // $ absolute
  revenuePerFTE: number; // $ absolute
  realizationPct: number;
  utilizationPct: number;
  effectiveRate: number; // $/hr realized
  lockupDays: number;
  wipDays: number;
  arDays: number;
  leverageRatio: number; // non-partner FTE per partner
  offshorePct: number;
  recurringRevenuePct: number;
  advisoryMixPct: number; // (advisory + cas) share of revenue
  top10ClientPct: number;
  netClientRetentionPct: number;
  seasonalityIndex: number; // % of revenue booked in Jan–Apr busy season
}

export interface ServiceLineSummary {
  line: ServiceLine;
  revenue: number; // $M, LTM
  revenueSharePct: number;
  recurringPct: number;
  grossMarginPct: number;
}

export interface LeadershipMember {
  role: string;
  name: string;
  retentionRisk: 'high' | 'medium' | 'low';
}

/** A fully-normalized firm — the object the dashboard and diagnostics run on. */
export interface Firm {
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
  partners: number;
  fte: number;
  raw: RawLedgerPull;
  metrics: FirmMetrics;
  serviceLines: ServiceLineSummary[];
  monthlyRevenue: { month: string; revenue: number }[];
  leadership: LeadershipMember[];
}
