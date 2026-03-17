import { Company, FrameworkScore, Status, TrendDirection } from './types';

export function calculateFinancialScore(company: Company): number {
  const recent = company.monthlyFinancials.slice(-3);
  if (recent.length === 0) return 3.0;

  const revenueAttainments = recent.map(m => m.revenue / m.revenuePlan);
  const ebitdaAttainments = recent.map(m =>
    m.ebitdaPlan !== 0 ? m.ebitda / m.ebitdaPlan : 1.0
  );
  const cashConversions = recent.map(m => m.cashConversion / 100);

  const avgRevAtt = revenueAttainments.reduce((a, b) => a + b, 0) / revenueAttainments.length;
  const avgEbitdaAtt = ebitdaAttainments.reduce((a, b) => a + b, 0) / ebitdaAttainments.length;
  const avgCashConv = cashConversions.reduce((a, b) => a + b, 0) / cashConversions.length;

  const revenueScore = Math.min(5, Math.max(1, avgRevAtt * 3.5));
  const ebitdaScore = Math.min(5, Math.max(1, avgEbitdaAtt * 3.5));
  const cashScore = Math.min(5, Math.max(1, avgCashConv * 5));

  const weighted = revenueScore * 0.40 + ebitdaScore * 0.40 + cashScore * 0.20;
  return Math.round(weighted * 10) / 10;
}

export function calculateOverallScore(scores: Omit<FrameworkScore, 'overall' | 'trend'>): number {
  const weights = {
    financial: 0.25,
    growth: 0.20,
    operational: 0.20,
    talent: 0.10,
    customer: 0.10,
    strategic: 0.10,
    risk: 0.05,
  };

  const weighted =
    scores.financial * weights.financial +
    scores.growth * weights.growth +
    scores.operational * weights.operational +
    scores.talent * weights.talent +
    scores.customer * weights.customer +
    scores.strategic * weights.strategic +
    scores.risk * weights.risk;

  return Math.round(weighted * 10) / 10;
}

export function getStatusFromScore(score: number): Status {
  if (score >= 4.0) return 'outperforming';
  if (score >= 3.0) return 'on-track';
  if (score >= 2.0) return 'watch';
  return 'intervention';
}

export function getScoreColor(score: number): string {
  if (score >= 4.0) return 'text-green-500';
  if (score >= 3.0) return 'text-blue-400';
  if (score >= 2.0) return 'text-amber-500';
  return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 4.0) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 3.0) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 2.0) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export function getScoreCellColor(score: number): string {
  if (score >= 4.5) return 'bg-green-500/30 text-green-300';
  if (score >= 4.0) return 'bg-green-500/20 text-green-400';
  if (score >= 3.5) return 'bg-blue-500/20 text-blue-300';
  if (score >= 3.0) return 'bg-blue-500/15 text-blue-400';
  if (score >= 2.5) return 'bg-amber-500/20 text-amber-400';
  if (score >= 2.0) return 'bg-amber-500/15 text-amber-500';
  return 'bg-red-500/20 text-red-400';
}

export function getStatusColors(status: Status): { bg: string; text: string; border: string } {
  switch (status) {
    case 'outperforming':
      return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' };
    case 'on-track':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' };
    case 'watch':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'intervention':
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
  }
}

export function getTrendColor(trend: TrendDirection, inverted = false): string {
  if (trend === 'flat') return 'text-slate-400';
  const isPositive = inverted ? trend === 'down' : trend === 'up';
  return isPositive ? 'text-green-400' : 'text-red-400';
}
