import { Status } from '@/lib/types';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  outperforming: {
    label: 'Outperforming',
    className: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  'on-track': {
    label: 'On Track',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  watch: {
    label: 'Watch',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  intervention: {
    label: 'Intervention',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center border rounded-full font-medium uppercase tracking-wider',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      )}
    >
      {config.label}
    </span>
  );
}
