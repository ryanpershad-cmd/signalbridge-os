import Anthropic from '@anthropic-ai/sdk';
import { buildFirm, FirmSeed } from '@/lib/firm/ingest';
import { diagnoseFirm } from '@/lib/firm/diagnostics';

export const runtime = 'nodejs';

// A safe default so buildFirm never crashes when the source is missing fields.
const DEFAULT_SEED: FirmSeed = {
  slug: 'imported-firm',
  name: 'Imported Firm',
  hq: '—',
  founded: 2000,
  focus: 'Imported from source data',
  system: 'csv',
  acquisitionDate: '2024-01-01',
  entryMultiple: 5,
  ownershipPct: 100,
  status: 'watch',
  integrationStage: 'diligence',
  accentColor: '#3b82f6',
  revenueLTM: 5,
  ebitdaMarginPct: 20,
  mix: { tax: 0.4, audit: 0.1, cas: 0.25, advisory: 0.25 },
  recurring: { tax: 40, audit: 60, cas: 90, advisory: 70 },
  partners: 5,
  fte: 40,
  offshoreFte: 4,
  realizationPct: 82,
  utilizationPct: 70,
  wip: 0.8,
  ar: 1.0,
  arOver90: 0.2,
  clientCount: 300,
  top10ClientPct: 30,
  churnedLTM: 15,
  addedLTM: 25,
  netRetentionPct: 95,
  partnerComp: 400000,
  onshoreComp: 85000,
  offshoreComp: 30000,
  leadership: [{ role: 'Managing Partner', name: '—', retentionRisk: 'medium' }],
};

const SYSTEM_PROMPT = `You map a single accounting firm's raw export (from QuickBooks, Xero, Sage, CCH, UltraTax, Karbon, a CSV, or a pasted P&L / AR aging / time-and-billing report) into a normalized FirmSeed.

Return ONLY valid JSON, no prose, in this shape:
{"seed": { ...only the FirmSeed fields you can determine from the data... }, "coverage": [ {"field": "revenueLTM", "status": "found" | "estimated" | "missing", "note": "short reason"} ]}

FirmSeed fields and units:
- revenueLTM ($M, trailing 12 months), ebitdaMarginPct (%), wip / ar / arOver90 ($M)
- mix: { tax, audit, cas, advisory } as revenue shares summing to ~1
- recurring: { tax, audit, cas, advisory } recurring % per line
- partners, fte, offshoreFte (headcounts), realizationPct (%), utilizationPct (%)
- clientCount, top10ClientPct (%), churnedLTM, addedLTM, netRetentionPct (%)
- partnerComp, onshoreComp, offshoreComp (annual $ per head)
- name, hq, founded, system ('quickbooks'|'xero'|'sage'|'cch-axcess'|'ultratax'|'karbon'|'csv')

Rules:
- Only include a field in "seed" if the data supports it (found) or you can reasonably derive it (estimated). Omit fields you cannot determine.
- For EVERY important field, add a coverage entry marking found / estimated / missing. Practice metrics like realizationPct, utilizationPct, offshorePct, and top10ClientPct usually require time-and-billing or practice-management data — mark them missing if the source is a general ledger only.
- Be honest about gaps; do not fabricate practice metrics from a general ledger.`;

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'AI is not configured (ANTHROPIC_API_KEY).' }, { status: 500 });

  try {
    const { source, name, raw } = await request.json();
    if (!raw || typeof raw !== 'string') return Response.json({ error: 'Provide raw export data.' }, { status: 400 });

    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Source system: ${source || 'unknown'}\nFirm name: ${name || 'Imported Firm'}\n\nRAW EXPORT:\n${raw.slice(0, 12000)}`,
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsed: { seed?: Partial<FirmSeed>; coverage?: { field: string; status: string; note: string }[] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return Response.json({ error: 'Could not parse the mapping. Try a cleaner export.' }, { status: 422 });
    }

    const slug = (name || 'imported-firm').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'imported-firm';
    const seed: FirmSeed = {
      ...DEFAULT_SEED,
      ...parsed.seed,
      slug,
      name: name || parsed.seed?.name || 'Imported Firm',
      mix: { ...DEFAULT_SEED.mix, ...(parsed.seed?.mix || {}) },
      recurring: { ...DEFAULT_SEED.recurring, ...(parsed.seed?.recurring || {}) },
      leadership: parsed.seed?.leadership && parsed.seed.leadership.length ? parsed.seed.leadership : DEFAULT_SEED.leadership,
    };

    const firm = buildFirm(seed);
    const diag = diagnoseFirm(firm);

    return Response.json({
      firm: {
        name: firm.name,
        system: firm.system,
        metrics: firm.metrics,
        serviceLines: firm.serviceLines,
      },
      diagnostic: {
        overallScore: diag.overallScore,
        currentEbitda: diag.currentEbitda,
        potentialEbitda: diag.potentialEbitda,
        totalEbitdaUplift: diag.totalEbitdaUplift,
        cashUnlocked: diag.cashUnlocked,
        evCreated: diag.evCreated,
        initiatives: diag.initiatives.length,
      },
      coverage: parsed.coverage || [],
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Ingestion failed' }, { status: 500 });
  }
}
