export type CompanySlug = 'northstar-foods' | 'apex-health' | 'vertex-logistics' | 'bluepeak-software' | 'harbor-home-services';
export type Sector = 'CPG' | 'Healthcare Services' | 'Logistics' | 'B2B SaaS' | 'Home Services';
export type Status = 'on-track' | 'watch' | 'intervention' | 'outperforming';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type InitiativeStatus = 'on-track' | 'at-risk' | 'overdue' | 'complete' | 'not-started';
export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TrendDirection = 'up' | 'down' | 'flat';
export type FunctionArea = 'GTM' | 'Finance' | 'Operations' | 'People' | 'Technology';

export interface MonthlyFinancials {
  month: string;
  revenue: number;
  revenuePlan: number;
  ebitda: number;
  ebitdaPlan: number;
  ebitdaMargin: number;
  cashConversion: number;
  workingCapitalDays: number;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: TrendDirection;
  history: { month: string; value: number }[];
  description?: string;
}

export interface Initiative {
  id: string;
  companySlug: CompanySlug;
  companyName: string;
  title: string;
  description: string;
  function: FunctionArea;
  owner: string;
  priority: Priority;
  status: InitiativeStatus;
  dueDate: string;
  startDate: string;
  progress: number;
  expectedImpact: string;
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  milestones: { title: string; date: string; complete: boolean }[];
  notes: string;
}

export interface Risk {
  id: string;
  companySlug: CompanySlug;
  companyName: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  likelihood: 'high' | 'medium' | 'low';
  owner: string;
  mitigationPlan: string;
  escalated: boolean;
  daysOpen: number;
  nextReviewDate: string;
  status: 'open' | 'mitigating' | 'resolved';
  resolvedDate?: string;
  function: FunctionArea;
}

export interface LeadershipRoster {
  role: string;
  name: string;
  tenureMonths: number;
  filled: boolean;
}

export interface FrameworkScore {
  financial: number;
  growth: number;
  operational: number;
  talent: number;
  customer: number;
  strategic: number;
  risk: number;
  overall: number;
  trend: TrendDirection;
}

export interface FunctionalScore {
  function: FunctionArea;
  score: number;
  commentary: string;
  trend: TrendDirection;
}

export interface Commentary {
  date: string;
  author: string;
  role: string;
  type: 'weekly' | 'monthly' | 'alert' | 'win';
  text: string;
}

export interface HeadcountSummary {
  total: number;
  plan: number;
  openRoles: number;
  recentHires: number;
  attritionRisk: 'high' | 'medium' | 'low';
  keyOpenRoles: string[];
}

export interface Company {
  slug: CompanySlug;
  name: string;
  sector: Sector;
  description: string;
  investmentThesis: string;
  ceo: string;
  holdPeriodStart: string;
  targetHoldPeriod: string;
  entryEBITDA: number;
  targetMOIC: number;
  status: Status;
  monthlyFinancials: MonthlyFinancials[];
  kpis: KPI[];
  initiatives: Initiative[];
  risks: Risk[];
  leadership: LeadershipRoster[];
  headcount: HeadcountSummary;
  frameworkScore: FrameworkScore;
  functionalScores: FunctionalScore[];
  commentary: Commentary[];
  recommendedActions: string[];
  benchmarkVsPortfolio: Record<string, number>;
}

export interface PortfolioSummary {
  totalRevenueLTM: number;
  totalRevenuePlan: number;
  totalEBITDALTM: number;
  totalEBITDAPlan: number;
  avgExecutionScore: number;
  initiativesOnTrackPct: number;
  openCriticalRisks: number;
  headcountAttainmentPct: number;
  trendRevenue: TrendDirection;
  trendEBITDA: TrendDirection;
}

export interface MonthlyAggregate {
  month: string;
  revenue: number;
  revenuePlan: number;
  ebitda: number;
  ebitdaPlan: number;
}

export interface AttentionItem {
  companySlug: CompanySlug;
  companyName: string;
  metric: string;
  issue: string;
  severity: RiskSeverity;
  delta?: string;
}

export interface ReviewTopic {
  companySlug: CompanySlug;
  companyName: string;
  topic: string;
  priority: Priority;
  owner: string;
  type: 'kpi-miss' | 'initiative-risk' | 'risk-escalation' | 'decision-needed' | 'win';
}
