import { Company } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import ScoreChip from '@/components/ui/ScoreChip';
import { Building2, Calendar, TrendingUp, User } from 'lucide-react';

interface CompanyHeaderProps {
  company: Company;
}

const sectorColors: Record<string, string> = {
  'CPG': 'bg-purple-500/15 text-purple-400',
  'Healthcare Services': 'bg-teal-500/15 text-teal-400',
  'Logistics': 'bg-amber-500/15 text-amber-400',
  'B2B SaaS': 'bg-blue-500/15 text-blue-400',
  'Home Services': 'bg-orange-500/15 text-orange-400',
};

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div className="bg-[#161b27] border border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Logo placeholder */}
          <div className="w-14 h-14 rounded-xl bg-[#0f1117] border border-slate-700 flex items-center justify-center flex-shrink-0">
            <Building2 size={24} className="text-slate-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{company.name}</h1>
              <StatusBadge status={company.status} size="md" />
              <span className={`text-[11px] px-2 py-1 rounded font-medium ${sectorColors[company.sector] ?? 'bg-slate-700/50 text-slate-400'}`}>
                {company.sector}
              </span>
            </div>
            <p className="text-[13px] text-slate-400 mb-3 leading-relaxed max-w-2xl">{company.description}</p>
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <User size={12} />
                <span>CEO: <span className="text-slate-300">{company.ceo}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Calendar size={12} />
                <span>Hold: <span className="text-slate-300">{company.holdPeriodStart} · {company.targetHoldPeriod}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <TrendingUp size={12} />
                <span>Entry EBITDA: <span className="text-slate-300 font-mono">${company.entryEBITDA}M</span></span>
              </div>
              <div className="text-[12px] text-slate-500">
                Target MOIC: <span className="text-slate-300 font-mono font-semibold">{company.targetMOIC}x</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Overall Score</p>
          <ScoreChip score={company.frameworkScore.overall} size="lg" />
        </div>
      </div>

      {/* Investment thesis */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Investment Thesis</p>
        <p className="text-[12px] text-slate-400 leading-relaxed">{company.investmentThesis}</p>
      </div>
    </div>
  );
}
