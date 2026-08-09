'use client';

import { useState } from 'react';
import { Plug, Upload, Loader2, CheckCircle2, AlertTriangle, MinusCircle, Database } from 'lucide-react';
import { firms } from '@/lib/firm/firms';
import { SYSTEM_LABELS, AccountingSystem } from '@/lib/firm/types';
import { getScoreColor } from '@/lib/scoring';

type Coverage = { field: string; status: string; note: string };
type Result = {
  firm: { name: string; system: string; metrics: Record<string, number> };
  diagnostic: { overallScore: number; currentEbitda: number; potentialEbitda: number; totalEbitdaUplift: number; cashUnlocked: number; evCreated: number; initiatives: number };
  coverage: Coverage[];
};

const SOURCES: { id: AccountingSystem; live: boolean }[] = [
  { id: 'quickbooks', live: true },
  { id: 'xero', live: true },
  { id: 'cch-axcess', live: false },
  { id: 'ultratax', live: false },
  { id: 'karbon', live: false },
  { id: 'csv', live: false },
];

const COV_ICON: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
  found: { icon: CheckCircle2, cls: 'text-green-400' },
  estimated: { icon: AlertTriangle, cls: 'text-amber-400' },
  missing: { icon: MinusCircle, cls: 'text-red-400' },
};

export default function SettingsPage() {
  const [source, setSource] = useState<AccountingSystem>('quickbooks');
  const [name, setName] = useState('');
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  async function mapData() {
    if (loading || !raw.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, name, raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to map data');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to map data');
    } finally {
      setLoading(false);
    }
  }

  const m = result?.firm.metrics;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Settings · Data Sources</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Connect each firm&rsquo;s accounting system and pull its data into the operating profile.</p>
      </div>

      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Connected Sources</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{firms.length} firms ingested · normalized to the common operating profile</p>
        </div>
        <div className="divide-y divide-slate-800/50">
          {firms.map((f) => (
            <div key={f.slug} className="flex items-center gap-4 px-5 py-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.accentColor }} />
              <span className="text-[13px] font-medium text-slate-200 flex-1 truncate">{f.name}</span>
              <span className="flex items-center gap-1.5 text-[12px] text-slate-400"><Database size={12} /> {SYSTEM_LABELS[f.system]}</span>
              <span className="flex items-center gap-1 text-[11px] text-green-400 w-32 justify-end"><CheckCircle2 size={11} /> Synced · full profile</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Connect a Live Source</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">QuickBooks and Xero support live API pulls. Others map from an export below.</p>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SOURCES.map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-800 bg-[#12151d] p-3">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-200 mb-1"><Plug size={12} /> {SYSTEM_LABELS[s.id]}</div>
              <div className={`text-[10px] ${s.live ? 'text-green-400' : 'text-slate-500'}`}>{s.live ? 'Live pull available' : 'Map from export'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#161b27] border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-[14px] font-semibold text-slate-200">Pull in Data</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Paste an export (P&amp;L, AR aging, time &amp; billing, staff roster). Claude maps it to the operating profile and flags gaps.</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={source} onChange={(e) => setSource(e.target.value as AccountingSystem)} className="bg-[#12151d] border border-slate-800 rounded-lg px-3 py-1.5 text-[12px] text-slate-300 outline-none focus:border-blue-500/50">
              {SOURCES.map((s) => <option key={s.id} value={s.id}>{SYSTEM_LABELS[s.id]}</option>)}
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Firm name" className="bg-[#12151d] border border-slate-800 rounded-lg px-3 py-1.5 text-[12px] text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50" />
            <button onClick={mapData} disabled={loading || !raw.trim()} className="flex items-center gap-1.5 text-[12px] text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors ml-auto">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {loading ? 'Mapping…' : 'Map with Claude'}
            </button>
          </div>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8} placeholder="Paste the firm's export here — a P&L, trial balance, AR aging, or time-and-billing report…" className="w-full bg-[#12151d] border border-slate-800 rounded-lg px-3 py-2 text-[12px] text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/50 font-mono resize-y" />
          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
      </div>

      {result && m && (
        <div className="bg-[#161b27] border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-200">{result.firm.name} · mapped profile</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Benchmark score <span className={getScoreColor(result.diagnostic.overallScore)}>{result.diagnostic.overallScore.toFixed(1)}/5</span> · +${result.diagnostic.totalEbitdaUplift.toFixed(1)}M EBITDA upside · {result.diagnostic.initiatives} initiatives</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ['Revenue LTM', `$${(m.revenueLTM as number).toFixed(1)}M`],
                ['EBITDA Margin', `${(m.ebitdaMarginPct as number).toFixed(0)}%`],
                ['Realization', `${(m.realizationPct as number).toFixed(0)}%`],
                ['Utilization', `${(m.utilizationPct as number).toFixed(0)}%`],
                ['Advisory Mix', `${(m.advisoryMixPct as number).toFixed(0)}%`],
                ['Lockup', `${Math.round(m.lockupDays as number)}d`],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg border border-slate-800 bg-[#12151d] p-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
                  <div className="text-[15px] font-mono font-semibold text-slate-100 mt-0.5">{val}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Coverage &amp; gaps</div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {result.coverage.map((c, i) => {
                  const cfg = COV_ICON[c.status] ?? COV_ICON.missing;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <Icon size={12} className={`${cfg.cls} mt-0.5 flex-shrink-0`} />
                      <span className="text-slate-300 font-medium w-28 flex-shrink-0">{c.field}</span>
                      <span className="text-slate-500">{c.note}</span>
                    </div>
                  );
                })}
                {result.coverage.length === 0 && <p className="text-[11px] text-slate-600">No coverage details returned.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
