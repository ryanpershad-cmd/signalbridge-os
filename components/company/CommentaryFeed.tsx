import { Commentary } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import clsx from 'clsx';
import { MessageCircle, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';

interface CommentaryFeedProps {
  commentary: Commentary[];
  limit?: number;
}

const typeConfig = {
  weekly: { icon: MessageCircle, color: 'text-slate-400', bg: 'bg-slate-700/20' },
  monthly: { icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  alert: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  win: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
};

const typeLabel = {
  weekly: 'Weekly Update',
  monthly: 'Monthly Review',
  alert: 'Alert',
  win: 'Platform Win',
};

export default function CommentaryFeed({ commentary, limit }: CommentaryFeedProps) {
  const items = limit ? commentary.slice(0, limit) : commentary;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const cfg = typeConfig[item.type];
        const Icon = cfg.icon;
        return (
          <div key={idx} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className={clsx('p-1.5 rounded-lg flex-shrink-0 mt-0.5', cfg.bg)}>
                <Icon size={13} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[12px] font-medium text-slate-200">{item.author}</span>
                  <span className="text-[10px] text-slate-500">·</span>
                  <span className="text-[11px] text-slate-500">{item.role}</span>
                  <span className="text-[10px] text-slate-500 ml-auto font-mono">{formatDate(item.date)}</span>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium',
                    item.type === 'win' ? 'bg-green-500/15 text-green-400' :
                    item.type === 'alert' ? 'bg-red-500/15 text-red-400' :
                    item.type === 'monthly' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-slate-700/50 text-slate-500'
                  )}>
                    {typeLabel[item.type]}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
