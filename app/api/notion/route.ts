import { firms } from '@/lib/firm/firms';
import { diagnoseFirm, FirmDiagnostic } from '@/lib/firm/diagnostics';
import { Firm } from '@/lib/firm/types';

export const runtime = 'nodejs';

const NOTION_VERSION = '2022-06-28';

type Block = Record<string, unknown>;

function rt(content: string) {
  return [{ type: 'text', text: { content } }];
}
function para(text: string): Block {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: rt(text) } };
}
function h2(text: string): Block {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: rt(text) } };
}
function divider(): Block {
  return { object: 'block', type: 'divider', divider: {} };
}
function todo(text: string, children?: Block[]): Block {
  const inner: Record<string, unknown> = { rich_text: rt(text), checked: false };
  if (children && children.length) inner.children = children;
  return { object: 'block', type: 'to_do', to_do: inner };
}

function fmtUnit(value: number, unit: string): string {
  if (unit === '%') return `${Math.round(value)}%`;
  if (unit === 'days') return `${Math.round(value)}d`;
  if (unit === 'x') return `${value.toFixed(1)}x`;
  if (unit === '$/hr') return `$${Math.round(value)}/hr`;
  if (unit === '$') return `$${Math.round(value).toLocaleString()}`;
  return `${value}`;
}

function buildChildren(diag: FirmDiagnostic): Block[] {
  const children: Block[] = [];
  children.push(
    para(
      `Benchmark score ${diag.overallScore}/5  ·  EBITDA $${diag.currentEbitda.toFixed(1)}M → $${diag.potentialEbitda.toFixed(1)}M (+$${diag.totalEbitdaUplift.toFixed(1)}M/yr)  ·  margin ${diag.marginBeforePct}% → ${diag.marginAfterPct}%  ·  +$${diag.evCreated.toFixed(1)}M enterprise value at ${diag.entryMultiple}x  ·  $${diag.cashUnlocked.toFixed(1)}M one-time cash`
    )
  );
  children.push(divider());
  children.push(h2('Value-creation initiatives (ranked by impact per unit of effort)'));
  diag.initiatives.forEach((i, n) => {
    const head =
      `${n + 1}. ${i.title} — +$${i.ebitdaImpact.toFixed(2)}M EBITDA/yr` +
      (i.cashReleased > 0 ? ` · +$${i.cashReleased.toFixed(1)}M cash` : '') +
      ` · ${i.leverLabel} · ${i.effort} effort · ${i.timeframeMonths} mo · ${i.owner}`;
    const kids: Block[] = [];
    kids.push(para(`Target: ${i.metricLabel} ${fmtUnit(i.currentValue, i.unit)} → ${fmtUnit(i.targetValue, i.unit)}`));
    kids.push(para(i.thesis));
    i.firstActions.forEach((a) => kids.push(todo(a)));
    kids.push(para(`KPIs: ${i.kpis.join(', ')}`));
    children.push(todo(head, kids));
  });
  return children;
}

export async function POST(request: Request) {
  const token = process.env.NOTION_TOKEN;
  const parent = process.env.NOTION_PARENT_PAGE_ID;
  if (!token || !parent) {
    return Response.json(
      { error: 'Notion is not configured. Set NOTION_TOKEN and NOTION_PARENT_PAGE_ID.' },
      { status: 500 }
    );
  }
  try {
    const { slug } = await request.json();
    const firm: Firm | undefined = firms.find((f) => f.slug === slug);
    if (!firm) return Response.json({ error: 'Unknown firm' }, { status: 400 });

    const diag = diagnoseFirm(firm);
    const body = {
      parent: { page_id: parent },
      icon: { type: 'emoji', emoji: '📋' },
      properties: { title: { title: rt(`SignalBridge — ${firm.name} · Value-Creation Plan`) } },
      children: buildChildren(diag),
    };

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: (data as { message?: string }).message || 'Notion API error' },
        { status: res.status }
      );
    }
    return Response.json({ url: (data as { url?: string }).url });
  } catch {
    return Response.json({ error: 'Failed to create Notion page' }, { status: 500 });
  }
}
