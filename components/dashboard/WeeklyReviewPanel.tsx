import Link from 'next/link';
import { ReviewTopic } from '@/lib/types';
import clsx from 'clsx';
import { AlertTriangle, TrendingDown, Zap, CheckCircle2 } from 'lucide-react';

interface WeeklyReviewPanelProps {
  topics: ReviewTopic[];
}

const typeConfig = {
  'kpi-miss': { icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'initiative-risk': { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  'risk-escalation': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/15' },
  'decision-needed': { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'win': { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
};

const priorityConfig = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-amber-500/15 text-amber-400',
  medium: 'bg-blue-500/15 text-blue-400',
  low: 'bg-slate-700/50 text-slate-400',
};

export default function WeeklyReviewPanel({ topics }: WeeklyReviewPanelProps) {
  return (
    <div className="space-y-2">
      {topics.map((topic, idx) => {
        const cfg = typeConfig[topic.type];
        const Icon = cfg.icon;
        return (
          <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className={clsx('p-1.5 rounded-lg flex-shrink-0', cfg.bg)}>
                <Icon size={13} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/company/${topic.companySlug}`}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {topic.companyName}
                  </Link>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium', priorityConfig[topic.priority])}>
                    {topic.priority}
                  </span>
                </div>
                <p className="text-[12px] text-slate-300 leading-relaxed">{topic.topic}</p>
                <p className="text-[10px] text-slate-600 mt-1">Owner: {topic.owner}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
