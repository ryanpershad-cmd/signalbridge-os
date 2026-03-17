import Link from 'next/link';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { AttentionItem } from '@/lib/types';
import clsx from 'clsx';

interface AttentionPanelProps {
  items: AttentionItem[];
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', badge: 'bg-red-500/15 text-red-400' },
  high: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/15 text-amber-400' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/15', badge: 'bg-amber-500/10 text-amber-500' },
  low: { icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/15', badge: 'bg-blue-500/10 text-blue-400' },
};

export default function AttentionPanel({ items }: AttentionPanelProps) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const cfg = severityConfig[item.severity];
        const Icon = cfg.icon;
        return (
          <div key={idx} className={clsx('border rounded-xl p-4', cfg.bg)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Icon size={16} className={clsx('flex-shrink-0 mt-0.5', cfg.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/company/${item.companySlug}`}
                      className="text-[12px] font-semibold text-slate-200 hover:text-blue-400 transition-colors"
                    >
                      {item.companyName}
                    </Link>
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium', cfg.badge)}>
                      {item.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{item.metric}</span>
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{item.issue}</p>
                </div>
              </div>
              {item.delta && (
                <span className="text-[12px] font-mono font-semibold text-red-400 flex-shrink-0">{item.delta}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
