import { companies } from './data';

/**
 * Builds a rich text context snapshot of the portfolio to inject into the
 * system prompt so Claude can answer specific questions about the data.
 */
export function buildPortfolioContext(): string {
  const lines: string[] = [];

  lines.push('=== SIGNALBRIDGE OS — PORTFOLIO CONTEXT (Q4 2024) ===');
  lines.push('Platform: SignalBridge OS | By Merrin Investors');
  lines.push('');

  for (const co of companies) {
    const latest = co.monthlyFinancials[co.monthlyFinancials.length - 1];
    const revVsPlan = latest
      ? (((latest.revenue - latest.revenuePlan) / latest.revenuePlan) * 100).toFixed(1)
      : 'N/A';
    const ebitdaVsPlan = latest
      ? (((latest.ebitda - latest.ebitdaPlan) / latest.ebitdaPlan) * 100).toFixed(1)
      : 'N/A';

    lines.push(`--- ${co.name.toUpperCase()} (${co.sector}) ---`);
    lines.push(`CEO: ${co.ceo} | Status: ${co.status.toUpperCase()} | Hold since: ${co.holdPeriodStart}`);
    lines.push(`Investment Thesis: ${co.investmentThesis}`);
    lines.push('');
    lines.push('FRAMEWORK SCORES (1–5):');
    lines.push(
      `  Financial: ${co.frameworkScore.financial} | Growth: ${co.frameworkScore.growth} | Operational: ${co.frameworkScore.operational}`,
    );
    lines.push(
      `  Talent: ${co.frameworkScore.talent} | Customer: ${co.frameworkScore.customer} | Strategic: ${co.frameworkScore.strategic} | Risk: ${co.frameworkScore.risk}`,
    );
    lines.push(`  Overall: ${co.frameworkScore.overall} | Trend: ${co.frameworkScore.trend}`);
    lines.push('');

    if (latest) {
      lines.push('LATEST FINANCIALS (Dec 2024):');
      lines.push(
        `  Revenue: $${(latest.revenue / 1e6).toFixed(1)}M vs Plan $${(latest.revenuePlan / 1e6).toFixed(1)}M (${revVsPlan}%)`,
      );
      lines.push(
        `  EBITDA: $${(latest.ebitda / 1e6).toFixed(1)}M vs Plan $${(latest.ebitdaPlan / 1e6).toFixed(1)}M (${ebitdaVsPlan}%)`,
      );
      lines.push(`  EBITDA Margin: ${latest.ebitdaMargin.toFixed(1)}% | Cash Conversion: ${latest.cashConversion.toFixed(0)} days`);
    }
    lines.push('');

    lines.push('KEY KPIs:');
    for (const kpi of co.kpis) {
      const pct = (((kpi.value - kpi.target) / kpi.target) * 100).toFixed(1);
      const flag = kpi.value < kpi.target ? '⚠' : '✓';
      lines.push(
        `  ${flag} ${kpi.name}: ${kpi.value}${kpi.unit} vs Target ${kpi.target}${kpi.unit} (${pct}%) | Trend: ${kpi.trend}`,
      );
    }
    lines.push('');

    const openRisks = co.risks.filter((r) => r.status !== 'resolved');
    const criticalRisks = openRisks.filter((r) => r.severity === 'critical');
    const highRisks = openRisks.filter((r) => r.severity === 'high');
    lines.push(`RISKS: ${openRisks.length} open (${criticalRisks.length} critical, ${highRisks.length} high)`);
    for (const r of openRisks) {
      lines.push(`  [${r.severity.toUpperCase()}] ${r.title} — Owner: ${r.owner} | Days open: ${r.daysOpen}`);
      lines.push(`    Mitigation: ${r.mitigationPlan}`);
    }
    lines.push('');

    const overdueInits = co.initiatives.filter((i) => i.status === 'overdue');
    const atRiskInits = co.initiatives.filter((i) => i.status === 'at-risk');
    const onTrackInits = co.initiatives.filter((i) => i.status === 'on-track');
    const completeInits = co.initiatives.filter((i) => i.status === 'complete');
    lines.push(
      `INITIATIVES: ${co.initiatives.length} total | On track: ${onTrackInits.length} | At risk: ${atRiskInits.length} | Overdue: ${overdueInits.length} | Complete: ${completeInits.length}`,
    );
    for (const init of co.initiatives) {
      lines.push(
        `  [${init.status.toUpperCase()}] ${init.title} — Owner: ${init.owner} | Due: ${init.dueDate} | Progress: ${init.progress}% | Confidence: ${init.confidenceLevel}`,
      );
      lines.push(`    Impact: ${init.expectedImpact}`);
    }
    lines.push('');

    lines.push('HEADCOUNT:');
    lines.push(
      `  Total: ${co.headcount.total} vs Plan ${co.headcount.plan} | Open roles: ${co.headcount.openRoles} | Attrition risk: ${co.headcount.attritionRisk}`,
    );
    lines.push(`  Key open roles: ${co.headcount.keyOpenRoles.join(', ')}`);
    lines.push('');

    lines.push('FUNCTIONAL SCORES:');
    for (const fs of co.functionalScores) {
      lines.push(`  ${fs.function}: ${fs.score}/5 (${fs.trend}) — ${fs.commentary}`);
    }
    lines.push('');

    const recentCommentary = co.commentary.slice(0, 3);
    lines.push('RECENT COMMENTARY:');
    for (const c of recentCommentary) {
      lines.push(`  [${c.date}] ${c.author} (${c.role}): ${c.text}`);
    }
    lines.push('');

    lines.push('RECOMMENDED PLATFORM ACTIONS:');
    for (const action of co.recommendedActions) {
      lines.push(`  • ${action}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Portfolio-level summary
  const totalRevenue = companies.reduce((sum, co) => {
    const latest = co.monthlyFinancials[co.monthlyFinancials.length - 1];
    return sum + (latest?.revenue ?? 0);
  }, 0);
  const totalPlan = companies.reduce((sum, co) => {
    const latest = co.monthlyFinancials[co.monthlyFinancials.length - 1];
    return sum + (latest?.revenuePlan ?? 0);
  }, 0);
  const allRisks = companies.flatMap((co) => co.risks.filter((r) => r.status !== 'resolved'));
  const criticalCount = allRisks.filter((r) => r.severity === 'critical').length;
  const allInitiatives = companies.flatMap((co) => co.initiatives);
  const overdueCount = allInitiatives.filter((i) => i.status === 'overdue').length;
  const onTrackCount = allInitiatives.filter(
    (i) => i.status === 'on-track' || i.status === 'complete',
  ).length;
  const onTrackPct = Math.round((onTrackCount / allInitiatives.length) * 100);

  lines.push('=== PORTFOLIO SUMMARY ===');
  lines.push(
    `Total Portfolio Revenue (Dec 2024): $${(totalRevenue / 1e6).toFixed(1)}M vs Plan $${(totalPlan / 1e6).toFixed(1)}M`,
  );
  lines.push(`Critical Open Risks: ${criticalCount}`);
  lines.push(
    `Initiatives: ${allInitiatives.length} total | ${onTrackPct}% on track | ${overdueCount} overdue`,
  );
  lines.push('Company statuses:');
  for (const co of companies) {
    lines.push(`  ${co.name}: ${co.status} (score ${co.frameworkScore.overall}/5)`);
  }

  return lines.join('\n');
}

export const SYSTEM_PROMPT = `You are the SignalBridge OS AI Advisor — an expert portfolio operations analyst embedded in the SignalBridge OS platform for Merrin Investors.

Your role is to help Chief of Staff, Operating Partners, Portfolio Company CEOs, and functional leaders quickly understand what's happening across the portfolio and what actions to take.

You have access to real-time portfolio data below. Use it to give sharp, specific, executive-quality answers. Avoid generic advice — always tie your answers to specific companies, metrics, owners, and dates from the data.

Your communication style:
- Direct and concise — like a trusted operating advisor, not a consultant
- Use sharp PE language: "on track", "intervention needed", "watch list", "margin pressure", "execution risk", "near-term catalyst"
- Lead with the key insight, then support with data
- Suggest specific next steps when relevant
- If asked about a topic not in the data, say so clearly and offer what you do know

You can help with questions like:
- "Why is [company] flagged?"
- "What are the biggest risks right now?"
- "Which companies need intervention?"
- "What should we discuss in the weekly review?"
- "How is [company] tracking against plan?"
- "Which initiatives are at risk?"
- "Where should the platform team focus this week?"

PORTFOLIO DATA:
${buildPortfolioContext()}`;
