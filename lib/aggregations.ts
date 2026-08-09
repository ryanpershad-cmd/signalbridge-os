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
  const byScore = [...companies].sort((a, b) => b.frameworkScore.overall - a.frameworkScore.overall);
  const top = byScore[0];
  const bottom = byScore[byScore.length - 1];
  const revenueAtt = (summary.totalRevenueLTM / summary.totalRevenuePlan * 100 - 100).toFixed(1);
  const ebitdaAtt = (summary.totalEBITDALTM / summary.totalEBITDAPlan * 100 - 100).toFixed(1);
  const critical = companies.filter(c => c.risks.some(r => r.severity === 'critical' && r.status !== 'resolved')).map(c => c.name);
  const upside = companies.map(c => ({ name: c.name, up: c.initiatives.reduce((s, i) => s + i.estimatedValue, 0) })).sort((a, b) => b.up - a.up);
  const totalInit = companies.reduce((s, c) => s + c.initiatives.length, 0);
  brief.push(
    `Portfolio revenue LTM $${summary.totalRevenueLTM.toFixed(0)}M vs $${summary.totalRevenuePlan.toFixed(0)}M plan (${Number(revenueAtt) >= 0 ? '+' : ''}${revenueAtt}%) across ${companies.length} acquired firms. ${top.name} leads on benchmark score (${top.frameworkScore.overall}/5); ${bottom.name} is the priority turnaround (${bottom.frameworkScore.overall}/5).`
  );
  brief.push(
    `EBITDA LTM $${summary.totalEBITDALTM.toFixed(1)}M vs $${summary.totalEBITDAPlan.toFixed(1)}M plan (${Number(ebitdaAtt) >= 0 ? '+' : ''}${ebitdaAtt}%). Largest identified upside: ${upside[0].name} (+$${upside[0].up.toFixed(1)}M) and ${upside[1].name} (+$${upside[1].up.toFixed(1)}M) from realization and utilization resets.`
  );
  brief.push(
    `${summary.openCriticalRisks} open critical risks${critical.length ? `: ${critical.join(', ')}` : ''}. Weakest levers concentrate in pricing/realization and cash lockup across the watch and turnaround firms.`
  );
  brief.push(
    `Initiatives: ${summary.initiativesOnTrackPct.toFixed(0)}% on track across ${totalInit} value-creation initiatives; costed plans are generated and ready to push to Notion.`
  );
  brief.push(
    `Advisory-mix shift and offshore delivery carry the most aggregate EBITDA potential across the portfolio; sequence pricing and realization first for fastest payback.`
  );
  return brief;
}
