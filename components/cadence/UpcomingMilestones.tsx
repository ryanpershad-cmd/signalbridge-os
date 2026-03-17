import { Company } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface UpcomingMilestonesProps {
  companies: Company[];
  daysAhead?: number;
}

export default function UpcomingMilestones({ companies, daysAhead = 60 }: UpcomingMilestonesProps) {
  const cutoffDate = new Date('2025-02-09'); // ~60 days from Dec 9 2024
  const today = new Date('2024-12-09');

  const milestones: {
    title: string;
    date: string;
    initiativeTitle: string;
    companyName: string;
    companySlug: string;
    complete: boolean;
    daysUntil: number;
  }[] = [];

  for (const company of companies) {
    for (const initiative of company.initiatives) {
      for (const milestone of initiative.milestones) {
        if (!milestone.complete) {
          const milestoneDate = new Date(milestone.date);
          const daysUntil = Math.round((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil >= 0 && milestoneDate <= cutoffDate) {
            milestones.push({
              title: milestone.title,
              date: milestone.date,
              initiativeTitle: initiative.title,
              companyName: company.name,
              companySlug: company.slug,
              complete: milestone.complete,
              daysUntil,
            });
          }
        }
      }
    }
  }

  milestones.sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-2">
      {milestones.slice(0, 12).map((m, idx) => (
        <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {m.complete
              ? <CheckCircle2 size={15} className="text-green-400" />
              : <Circle size={15} className="text-slate-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-slate-200 mb-0.5">{m.title}</p>
            <p className="text-[11px] text-slate-500">{m.initiativeTitle}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[10px] bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded">{m.companyName}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock size={10} />
                <span className="font-mono">{formatDate(m.date)}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className={clsx(
              'text-[11px] font-mono font-semibold',
              m.daysUntil <= 14 ? 'text-amber-400' : 'text-slate-400'
            )}>
              {m.daysUntil}d
            </p>
          </div>
        </div>
      ))}
      {milestones.length === 0 && (
        <p className="text-[12px] text-slate-600 text-center py-8">No upcoming milestones in the next {daysAhead} days.</p>
      )}
    </div>
  );
}
