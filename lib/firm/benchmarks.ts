// ============================================================================
// Platform benchmarks for an accounting-firm roll-up.
// These are the "good platform firm" targets the operating layer drives toward.
// Each metric declares a direction so gaps score consistently.
// ============================================================================

import { FirmMetrics } from './types';

export type MetricKey = keyof FirmMetrics;

export interface Benchmark {
  key: MetricKey;
  label: string;
  /** 'higher' = bigger is better; 'lower' = smaller is better. */
  direction: 'higher' | 'lower';
  /** Platform target (a strong, well-run firm). */
  target: number;
  /** Roughly the floor of acceptable — used to scale the 1–5 score. */
  floor: number;
  unit: '$' | '%' | 'x' | 'days' | '$/hr';
  /** Which value lever this metric primarily informs. */
  lever: LeverKey;
}

export type LeverKey =
  | 'pricing'
  | 'serviceMix'
  | 'laborModel'
  | 'utilization'
  | 'cashLockup'
  | 'clientPortfolio';

export const LEVER_LABELS: Record<LeverKey, string> = {
  pricing: 'Pricing & Realization',
  serviceMix: 'Service-Mix Shift to Advisory',
  laborModel: 'Labor Model & Offshore',
  utilization: 'Utilization & Capacity',
  cashLockup: 'Cash & Lockup',
  clientPortfolio: 'Client Portfolio',
};

export const BENCHMARKS: Benchmark[] = [
  { key: 'realizationPct', label: 'Realization', direction: 'higher', target: 92, floor: 72, unit: '%', lever: 'pricing' },
  { key: 'effectiveRate', label: 'Effective Rate', direction: 'higher', target: 245, floor: 150, unit: '$/hr', lever: 'pricing' },
  { key: 'advisoryMixPct', label: 'Advisory + CAS Mix', direction: 'higher', target: 45, floor: 15, unit: '%', lever: 'serviceMix' },
  { key: 'recurringRevenuePct', label: 'Recurring Revenue', direction: 'higher', target: 65, floor: 35, unit: '%', lever: 'serviceMix' },
  { key: 'offshorePct', label: 'Offshore Mix', direction: 'higher', target: 30, floor: 0, unit: '%', lever: 'laborModel' },
  { key: 'revenuePerFTE', label: 'Revenue / FTE', direction: 'higher', target: 165000, floor: 95000, unit: '$', lever: 'laborModel' },
  { key: 'leverageRatio', label: 'Leverage Ratio', direction: 'higher', target: 6, floor: 2, unit: 'x', lever: 'laborModel' },
  { key: 'utilizationPct', label: 'Utilization', direction: 'higher', target: 78, floor: 55, unit: '%', lever: 'utilization' },
  { key: 'lockupDays', label: 'Lockup Days', direction: 'lower', target: 55, floor: 120, unit: 'days', lever: 'cashLockup' },
  { key: 'ebitdaMarginPct', label: 'EBITDA Margin', direction: 'higher', target: 32, floor: 15, unit: '%', lever: 'utilization' },
  { key: 'top10ClientPct', label: 'Top-10 Client Concentration', direction: 'lower', target: 22, floor: 55, unit: '%', lever: 'clientPortfolio' },
  { key: 'netClientRetentionPct', label: 'Net Client Retention', direction: 'higher', target: 98, floor: 82, unit: '%', lever: 'clientPortfolio' },
];

export const BENCHMARKS_BY_KEY: Record<string, Benchmark> = Object.fromEntries(
  BENCHMARKS.map((b) => [b.key, b])
);

/**
 * Score a single metric 1.0–5.0 against its benchmark.
 * At/above target -> ~5; at/below floor -> ~1; linear in between.
 */
export function scoreMetric(key: MetricKey, value: number): number {
  const b = BENCHMARKS_BY_KEY[key];
  if (!b) return 3.0;
  let pct: number;
  if (b.direction === 'higher') {
    pct = (value - b.floor) / (b.target - b.floor);
  } else {
    pct = (b.floor - value) / (b.floor - b.target);
  }
  const score = 1 + Math.max(0, Math.min(1, pct)) * 4;
  return Math.round(score * 10) / 10;
}

/** Signed gap vs target, oriented so negative = below target (needs work). */
export function metricGap(key: MetricKey, value: number): number {
  const b = BENCHMARKS_BY_KEY[key];
  if (!b) return 0;
  const raw = value - b.target;
  return b.direction === 'higher' ? raw : -raw;
}
