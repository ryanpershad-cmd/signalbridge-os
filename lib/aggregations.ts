import { Company, PortfolioSummary, MonthlyAggregate, AttentionItem, ReviewTopic } from './types';

export function getPortfolioSummary(companies: Company[]): PortfolioSummary {
  const totalRevenueLTM = companies.reduce((sum, c) => {
    return sum + c.monthlyFinancials.slice(-12).reduce((s, m) => s + m.revenue, 0);
  }, 0);

  const totalRevenuePlan = companies.reduce((sum, c) => {
    return sum + c.monthlyFinancials.slice(-12).reduce((s, m) => s + m.revenuePlan, 0);
  }, 0);

  const totalEBITDALTM = companies.reduce((sum, c) => {
    return sum + c.monthlyFinancials.slice(-12).reduce((s, m) => s + m.ebitda, 0);
  }, 0);

  const totalEBITDAPlan = companies.reduce((sum, c) => {
    return sum + c.monthlyFinancials.slice(-12).reduce((s, m) => s + m.ebitdaPlan, 0);
  }, 0);

  const avgExecutionScore =
    companies.reduce((sum, c) => sum + c.frameworkScore.overall, 0) / companies.length;

  const allInitiatives = companies.flatMap(c => c.initiatives);
  const onTrackInitiatives = allInitiatives.filter(
    i => i.status === 'on-track' || i.status === 'complete'
  );
  const initiativesOnTrackPct = allInitiatives.length > 0
    ? (onTrackInitiatives.length / allInitiatives.length) * 100
    : 0;

  const openCriticalRisks = companies.reduce((sum, c) => {
    return sum + c.risks.filter(r => r.severity === 'critical' && r.status !== 'resolved').length;
  }, 0);

  const totalHeadcount = companies.reduce((sum, c) => sum + c.headcount.total, 0);
  const totalHeadcountPlan = companies.reduce((sum, c) => sum + c.headcount.plan, 0);
  const headcountAttainmentPct = totalHeadcountPlan > 0
    ? (totalHeadcount / totalHeadcountPlan) * 100
    : 100;

  const recentRevenue = companies.map(c => c.monthlyFinancials.slice(-1)[0]?.revenue ?? 0);
  const prevRevenue = companies.map(c => c.monthlyFinancials.slice(-4, -3)[0]?.revenue ?? 0);
  const revenueSum = recentRevenue.reduce((a, b) => a + b, 0);
  const prevRevenueSum = prevRevenue.reduce((a, b) => a + b, 0);
  const trendRevenue = revenueSum > prevRevenueSum * 1.01 ? 'up' : revenueSum < prevRevenueSum * 0.99 ? 'down' : 'flat';

  const recentEBITDA = companies.map(c => c.monthlyFinancials.slice(-1)[0]?.ebitda ?? 0);
  const prevEBITDA = companies.map(c => c.monthlyFinancials.slice(-4, -3)[0]?.ebitda ?? 0);
  const ebitdaSum = recentEBITDA.reduce((a, b) => a + b, 0);
  const prevEBITDASum = prevEBITDA.reduce((a, b) => a + b, 0);
  const trendEBITDA = ebitdaSum > prevEBITDASum * 1.01 ? 'up' : ebitdaSum < prevEBITDASum * 0.99 ? 'down' : 'flat';

  return {
    totalRevenueLTM,
    totalRevenuePlan,
    totalEBITDALTM,
    totalEBITDAPlan,
    avgExecutionScore,
    initiativesOnTrackPct,
    openCriticalRisks,
    headcountAttainmentPct,
    trendRevenue,
    trendEBITDA,
  };
}

export function getPortfolioMonthlyTrend(companies: Company[]): MonthlyAggregate[] {
  const months = companies[0]?.monthlyFinancials.map(m => m.month) ?? [];

  return months.map(month => {
    const revenue = companies.reduce((sum, c) => {
      const mf = c.monthlyFinancials.find(m => m.month === month);
      return sum + (mf?.revenue ?? 0);
    }, 0);

    const revenuePlan = companies.reduce((sum, c) => {
      const mf = c.monthlyFinancials.find(m => m.month === month);
      return sum + (mf?.revenuePlan ?? 0);
    }, 0);

    const ebitda = companies.reduce((sum, c) => {
      const mf = c.monthlyFinancials.find(m => m.month === month);
      return sum + (mf?.ebitda ?? 0);
    }, 0);

    const ebitdaPlan = companies.reduce((sum, c) => {
      const mf = c.monthlyFinancials.find(m => m.month === month);
      return sum + (mf?.ebitdaPlan ?? 0);
    }, 0);

    return { month, revenue, revenuePlan, ebitda, ebitdaPlan };
  });
}

export function getAttentionItems(companies: Company[]): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const company of companies) {
    if (company.status === 'intervention' || company.status === 'watch') {
      const criticalRisks = company.risks.filter(r => r.severity === 'critical' && r.status !== 'resolved');
      for (const risk of criticalRisks.slice(0, 2)) {
        items.push({
          companySlug: company.slug,
          companyName: company.name,
          metric: 'Critical Risk',
          issue: risk.title,
          severity: 'critical',
        });
      }

      const overdueInitiatives = company.initiatives.filter(i => i.status === 'overdue');
      for (const init of overdueInitiatives.slice(0, 1)) {
        items.push({
          companySlug: company.slug,
          companyName: company.name,
          metric: 'Overdue Initiative',
          issue: init.title,
          severity: 'high',
        });
      }

      if (company.status === 'intervention') {
        const revenueAtt = company.monthlyFinancials.slice(-1)[0];
        if (revenueAtt) {
          const pct = ((revenueAtt.revenue - revenueAtt.revenuePlan) / revenueAtt.revenuePlan * 100).toFixed(1);
          items.push({
            companySlug: company.slug,
            companyName: company.name,
            metric: 'Revenue vs Plan',
            issue: `Revenue ${pct}% vs plan — sustained underperformance`,
            severity: 'critical',
            delta: `${pct}%`,
          });
        }
      }
    }
  }

  return items.slice(0, 6);
}

export function getPlatformWins(companies: Company[]): string[] {
  const wins: string[] = [];

  for (const company of companies) {
    const recentWins = company.commentary.filter(c => c.type === 'win').slice(0, 1);
    for (const win of recentWins) {
      wins.push(`${company.name}: ${win.text.substring(0, 120)}...`);
    }
  }

  return wins.slice(0, 4);
}

export function getWeeklyReviewTopics(companies: Company[]): ReviewTopic[] {
  const topics: ReviewTopic[] = [];

  for (const company of companies) {
    const criticalInitiatives = company.initiatives.filter(
      i => (i.status === 'at-risk' || i.status === 'overdue') && i.priority === 'critical'
    );

    for (const init of criticalInitiatives.slice(0, 1)) {
      topics.push({
        companySlug: company.slug,
        companyName: company.name,
        topic: `${init.title} — ${init.status === 'overdue' ? 'OVERDUE' : 'At Risk'}: ${init.notes.substring(0, 80)}...`,
        priority: 'critical',
        owner: init.owner,
        type: init.status === 'overdue' ? 'initiative-risk' : 'initiative-risk',
      });
    }

    const escalatedRisks = company.risks.filter(r => r.escalated && r.status !== 'resolved');
    for (const risk of escalatedRisks.slice(0, 1)) {
      topics.push({
        companySlug: company.slug,
        companyName: company.name,
        topic: `Risk Escalation: ${risk.title}`,
        priority: 'critical',
        owner: risk.owner,
        type: 'risk-escalation',
      });
    }
  }

  return topics.slice(0, 6);
}

export function generateExecutiveBrief(companies: Company[]): string[] {
  const summary = getPortfolioSummary(companies);
  const brief: string[] = [];

  const revenueAtt = (summary.totalRevenueLTM / summary.totalRevenuePlan * 100 - 100).toFixed(1);
  brief.push(
    `Portfolio revenue LTM $${summary.totalRevenueLTM.toFixed(0)}M vs $${summary.totalRevenuePlan.toFixed(0)}M plan (${Number(revenueAtt) >= 0 ? '+' : ''}${revenueAtt}%) — BluePeak and Northstar outperformance partially offset by Apex Health and Harbor underperformance.`
  );

  const ebitdaAtt = (summary.totalEBITDALTM / summary.totalEBITDAPlan * 100 - 100).toFixed(1);
  brief.push(
    `EBITDA LTM $${summary.totalEBITDALTM.toFixed(1)}M vs $${summary.totalEBITDAPlan.toFixed(1)}M plan (${Number(ebitdaAtt) >= 0 ? '+' : ''}${ebitdaAtt}%) — margin compression at Apex Health (-600bps) and Harbor (-400bps) are primary drag on portfolio EBITDA.`
  );

  brief.push(
    `${summary.openCriticalRisks} open critical risks across portfolio: Apex Health (Medicaid reimbursement, COO gap), Harbor Home Services (close rate decline). Both companies on elevated monitoring cadence with weekly operating calls.`
  );

  brief.push(
    `Initiatives: ${summary.initiativesOnTrackPct.toFixed(0)}% on track. Key overdue items: Apex Health clinician utilization program and Harbor membership launch. Both require CEO-level intervention within 30 days.`
  );

  brief.push(
    `BluePeak ARR $67.2M (+59% YoY) — tracking to become 35% of portfolio value within 24 months. Engineering talent gap is primary risk to growth trajectory; compensation adjustment required in Q1 2025.`
  );

  brief.push(
    `Vertex Logistics showing 6-month consecutive improvement across OTD (84%→91%), route margin (+350bps), and driver turnover (-14pts). Turnaround thesis intact — dedicated contract close is the key near-term value creation lever.`
  );

  brief.push(
    `Portfolio headcount at ${summary.headcountAttainmentPct.toFixed(0)}% of plan — talent remains the #1 execution constraint across 4 of 5 companies. Recommend portfolio-wide compensation benchmarking as a Q1 2025 platform initiative.`
  );

  return brief;
}
