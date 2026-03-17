import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TrendDirection } from '@/lib/types';
import clsx from 'clsx';

interface TrendArrowProps {
  direction: TrendDirection;
  inverted?: boolean;
  size?: number;
  showLabel?: boolean;
}

export default function TrendArrow({ direction, inverted = false, size = 14, showLabel = false }: TrendArrowProps) {
  const isPositive = inverted ? direction === 'down' : direction === 'up';
  const isNeutral = direction === 'flat';

  const colorClass = isNeutral
    ? 'text-slate-500'
    : isPositive
    ? 'text-green-400'
    : 'text-red-400';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={clsx('inline-flex items-center gap-1', colorClass)}>
      <Icon size={size} />
      {showLabel && (
        <span className="text-[10px] font-medium">
          {direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'Flat'}
        </span>
      )}
    </span>
  );
}
