'use client';

import { X, CheckCircle2, Circle, Calendar, User, Target, DollarSign } from 'lucide-react';
import { Initiative } from '@/lib/types';
import { formatDate, formatProgressColor } from '@/lib/formatters';
import clsx from 'clsx';

interface InitiativeDrawerProps {
  initiative: Initiative | null;
  onClose: () => void;
}

const statusConfig = {
  'on-track': { label: 'On Track', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'at-risk': { label: 'At Risk', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'overdue': { label: 'Overdue', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  'complete': { label: 'Complete', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  'not-started': { label: 'Not Started', className: 'bg-slate-700/50 text-slate-400 border-slate-600/30' },
};

const priorityConfig = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-amber-500/15 text-amber-400',
  medium: 'bg-blue-500/15 text-blue-400',
  low: 'bg-slate-700/50 text-slate-400',
};

const confidenceConfig = {
  high: 'text-green-400',
  medium: 'text-amber-400',
  low: 'text-red-400',
};

export default function InitiativeDrawer({ initiative, onClose }: InitiativeDrawerProps) {
  if (!initiative) return null;

  const statusCfg = statusConfig[initiative.status];
  const completedMilestones = initiative.milestones.filter(m => m.complete).length;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-[#161b27] border-l border-slate-800 z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium', statusCfg.className)}>
                {statusCfg.label}
              </span>
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium', priorityConfig[initiative.priority])}>
                {initiative.priority}
              </span>
            </div>
            <h2 className="text-[15px] font-semibold text-slate-100 leading-snug">{initiative.title}</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">{initiative.companyName} · {initiative.function}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Progress</span>
              <span className="text-[13px] font-mono font-semibold text-slate-200">{initiative.progress}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', formatProgressColor(initiative.progress))}
                style={{ width: `${initiative.progress}%` }}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1117] rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User size={11} /> Owner
              </p>
              <p className="text-[12px] text-slate-300">{initiative.owner}</p>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar size={11} /> Due Date
              </p>
              <p className="text-[12px] text-slate-300 font-mono">{formatDate(initiative.dueDate)}</p>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DollarSign size={11} /> Est. Value
              </p>
              <p className="text-[12px] text-slate-300 font-mono font-semibold">${initiative.estimatedValue}M</p>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Target size={11} /> Confidence
              </p>
              <p className={clsx('text-[12px] font-medium capitalize', confidenceConfig[initiative.confidenceLevel])}>
                {initiative.confidenceLevel}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-[12px] text-slate-300 leading-relaxed">{initiative.description}</p>
          </div>

          {/* Expected Impact */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Expected Impact</p>
            <p className="text-[12px] text-emerald-400 leading-relaxed">{initiative.expectedImpact}</p>
          </div>

          {/* Milestones */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Milestones ({completedMilestones}/{initiative.milestones.length})
            </p>
            <div className="space-y-2">
              {initiative.milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  {milestone.complete
                    ? <CheckCircle2 size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                    : <Circle size={15} className="text-slate-600 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-[12px]', milestone.complete ? 'text-slate-400 line-through' : 'text-slate-300')}>
                      {milestone.title}
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono">{formatDate(milestone.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {initiative.notes && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-[12px] text-slate-400 leading-relaxed bg-[#0f1117] rounded-lg p-3">
                {initiative.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
