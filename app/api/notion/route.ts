import { firms } from '@/lib/firm/firms';
import { diagnoseFirm, Initiative } from '@/lib/firm/diagnostics';
import { Firm, FirmStatus } from '@/lib/firm/types';

export const runtime = 'nodejs';

const NOTION_VERSION = '2022-06-28';
const API = 'https://api.notion.com/v1';

type Json = Record<string, unknown>;

const STATUS_LABEL: Record<FirmStatus, string> = {
  platform: 'Platform',
  performing: 'Performing',
  watch: 'Watch',
  turnaround: 'Turnaround',
};

function fmtUnit(value: number, unit: string): string {
  if (unit === '%') return `${Math.round(value)}%`;
  if (unit === 'days') return `${Math.round(value)}d`;
  if (unit === 'x') return `${value.toFixed(1)}x`;
  if (unit === '$/hr') return `$${Math.round(value)}/hr`;
  if (unit === '$') return `$${Math.round(value).toLocaleString()}`;
  return `${value}`;
}
const title = (s: string) => ({ title: [{ text: { content: s } }] });
const text = (s: string) => ({ rich_text: [{ text: { content: s } }] });
const num = (n: number) => ({ number: n });
const sel = (n: string) => ({ select: { name: n } });
const stat = (n: string) => ({ status: { name: n } });
const rel = (ids: string[]) => ({ relation: ids.map((id) => ({ id })) });

function rtx(content: string, italic = false) {
  return [{ type: 'text', text: { content }, annotations: { italic } }];
}
function initiativeBlocks(i: Initiative): Json[] {
  const blocks: Json[] = [];
  blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: rtx(i.thesis, true) } });
  blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: rtx('First moves') } });
  i.firstActions.forEach((a) =>
    blocks.push({ object: 'block', type: 'to_do', to_do: { rich_text: rtx(a), checked: false } })
  );
  blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: rtx(`KPIs: ${i.kpis.join(', ')}`) } });
  return blocks;
}

async function notion(path: string, method: string, token: string, body?: Json) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as Json;
  if (!res.ok) throw new Error((data as { message?: string }).message || `Notion ${method} ${path} failed`);
  return data;
}

export async function POST(request: Request) {
  const token = process.env.NOTION_TOKEN;
  const firmsDb = process.env.NOTION_FIRMS_DB_ID;
  const initiativesDb = process.env.NOTION_INITIATIVES_DB_ID;
  if (!token || !firmsDb || !initiativesDb) {
    return Response.json(
      { error: 'Notion is not configured (NOTION_TOKEN / NOTION_FIRMS_DB_ID / NOTION_INITIATIVES_DB_ID).' },
      { status: 500 }
    );
  }

  try {
    const { slug } = await request.json();
    const firm: Firm | undefined = firms.find((f) => f.slug === slug);
    if (!firm) return Response.json({ error: 'Unknown firm' }, { status: 400 });
    const diag = diagnoseFirm(firm);

    const firmProps: Json = {
      Firm: title(firm.name),
      Status: sel(STATUS_LABEL[firm.status]),
      HQ: text(firm.hq),
      'Benchmark Score': num(diag.overallScore),
      'Revenue LTM ($M)': num(Math.round(firm.metrics.revenueLTM * 10) / 10),
      'EBITDA Now ($M)': num(diag.currentEbitda),
      'EBITDA Potential ($M)': num(diag.potentialEbitda),
      'EBITDA Uplift ($M)': num(diag.totalEbitdaUplift),
      'EV Created ($M)': num(diag.evCreated),
      'Entry Multiple': num(firm.entryMultiple),
    };

    // Upsert firm row (match by title)
    const found = (await notion(`/databases/${firmsDb}/query`, 'POST', token, {
      filter: { property: 'Firm', title: { equals: firm.name } },
      page_size: 1,
    })) as { results?: { id: string }[] };
    let firmPageId: string;
    let firmUrl: string;
    if (found.results && found.results.length) {
      firmPageId = found.results[0].id;
      const updated = (await notion(`/pages/${firmPageId}`, 'PATCH', token, { properties: firmProps })) as {
        url?: string;
      };
      firmUrl = updated.url || '';
    } else {
      const created = (await notion(`/pages`, 'POST', token, {
        parent: { database_id: firmsDb },
        properties: firmProps,
      })) as { id: string; url?: string };
      firmPageId = created.id;
      firmUrl = created.url || '';
    }

    // Remove this firm's existing initiatives so re-push stays clean
    const existing = (await notion(`/databases/${initiativesDb}/query`, 'POST', token, {
      filter: { property: 'Firm', relation: { contains: firmPageId } },
      page_size: 100,
    })) as { results?: { id: string }[] };
    for (const row of existing.results || []) {
      await notion(`/pages/${row.id}`, 'PATCH', token, { archived: true });
    }

    // Create initiatives
    for (const i of diag.initiatives) {
      await notion(`/pages`, 'POST', token, {
        parent: { database_id: initiativesDb },
        properties: {
          Initiative: title(i.title),
          Firm: rel([firmPageId]),
          Lever: sel(i.leverLabel),
          'EBITDA Impact ($M/yr)': num(i.ebitdaImpact),
          'One-time Cash ($M)': num(i.cashReleased),
          Effort: sel(i.effort),
          'Timeframe (mo)': num(i.timeframeMonths),
          Owner: text(i.owner),
          'Metric Target': text(`${i.metricLabel} ${fmtUnit(i.currentValue, i.unit)} → ${fmtUnit(i.targetValue, i.unit)}`),
          Priority: num(i.priorityScore),
          Status: stat('Not started'),
        },
        children: initiativeBlocks(i),
      });
    }

    return Response.json({ url: firmUrl, firm: firm.name, initiatives: diag.initiatives.length });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Failed to push to Notion' }, { status: 500 });
  }
}
