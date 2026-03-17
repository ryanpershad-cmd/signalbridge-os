# SignalBridge OS

A polished private equity portfolio operations dashboard built for **SignalBridge Capital**. Tracks 5 portfolio companies across financial performance, KPIs, initiatives, risks, and operating cadence.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production build:
```bash
npm run build
npm start
```

## Architecture

**Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide React

**Data Layer** (`lib/`): All data is static mock data seeded in `lib/data/` — one file per portfolio company with 12 months of financials, KPIs, initiatives, risks, leadership, and commentary. The `lib/aggregations.ts` module computes portfolio-level summaries, trend data, attention items, and executive briefs at runtime. Scoring logic in `lib/scoring.ts` converts raw metrics to 1-5 framework scores.

**Component Architecture**: Components are organized by domain — `layout/` for the app shell, `ui/` for reusable primitives (MetricCard, ScoreChip, StatusBadge, TrendArrow, FilterBar, InitiativeDrawer), `charts/` for Recharts wrappers, `dashboard/` for portfolio-level panels, and `company/`, `initiatives/`, `risks/`, `cadence/` for page-specific components. All components using React state or browser APIs are marked `'use client'`.

**Pages**: 5 main routes — Portfolio Overview (`/`), Company Detail (`/company/[slug]`), Initiatives Command Center (`/initiatives`), Risks & Blockers (`/risks`), and Operating Cadence (`/cadence`).

## Operating Philosophy

The dashboard reflects a disciplined PE operating model: every portfolio company is assessed across 7 framework dimensions (Financial, Growth, Operational, Talent, Customer, Strategic, Risk), each scored 1-5. Scores drive status classification — Outperforming (4.0+), On Track (3.0-3.9), Watch (2.0-2.9), Intervention (<2.0). The initiative tracking system enforces accountability through milestone-level granularity, confidence ratings, and estimated value creation. Risk management uses severity x likelihood matrix positioning with explicit mitigation plans and escalation flags.

## Portfolio Companies

| Company | Sector | Status | Score |
|---|---|---|---|
| Northstar Foods | CPG | Outperforming | 4.4 |
| BluePeak Software | B2B SaaS | Outperforming | 4.4 |
| Vertex Logistics | Logistics | Watch (Improving) | 2.9 |
| Harbor Home Services | Home Services | Watch | 2.6 |
| Apex Health | Healthcare Services | Intervention | 2.3 |

## Future Enhancements

- **Real data integration**: Connect to portfolio company ERP/CRM systems via API (NetSuite, Salesforce, HubSpot) for live KPI feeds
- **Benchmarking engine**: Industry benchmarks from PitchBook/Capital IQ to contextualize performance vs. sector peers
- **Board pack generation**: Auto-generate quarterly board presentations from dashboard data
- **Scenario modeling**: What-if analysis for key operational levers (utilization improvement, price increase, market expansion)
- **Notifications**: Configurable alert thresholds with Slack/email notifications for KPI breaches and overdue milestones
- **Document management**: Attach financials, board decks, and diligence materials to company profiles
- **Mobile view**: Responsive design for mobile access during portfolio company visits
