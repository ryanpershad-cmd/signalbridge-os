import { ReviewTopic } from '@/lib/types';
import Link from 'next/link';
import { AlertTriangle, TrendingDown, Zap, CheckCircle2, Clock } from 'lucide-react';
import clsx from 'clsx';

interface WeeklyAgendaProps {
  topics: ReviewTopic[];
}

const typeConfig = {
  'kpi-miss': { icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'KPI Miss' },
  'initiative-risk': { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Initiative Risk' },
  'risk-escalation': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/15', label: 'Risk Escalation' },
  'decision-needed': { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Decision Needed' },
  'win': { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Win' },
};

const priorityConfig = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-amber-500/15 text-amber-400',
  medium: 'bg-blue-500/15 text-blue-400',
  low: 'bg-slate-700/50 text-slate-400',
};

export default function WeeklyAgenda({ topics }: WeeklyAgendaProps) {
  return (
    <div className="space-y-2">
      {topics.map((topic, idx) => {
        const cfg = typeConfig[topic.type];
        const Icon = cfg.icon;
        return (
          <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 mt-0.5">
                {idx + 1}
              </div>
              <div className={clsx('p-1.5 rounded-lg flex-shrink-0 mt-0.5', cfg.bg)}>
                <Icon size={13} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium', priorityConfig[topic.priority])}>
                    {topic.priority}
                  </span>
                  <span className="text-[10px] bg-slate-800/50 text-slate-500 px-1.5 py-0.5 rounded">
                    {cfg.label}
                  </span>
                  <Link
                    href={`/company/${topic.companySlug}`}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    {topic.companyName}
                  </Link>
                </div>
                <p className="text-[12px] text-slate-300 leading-relaxed">{topic.topic}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={11} className="text-slate-600" />
                  <span className="text-[10px] text-slate-600">Owner: {topic.owner}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
