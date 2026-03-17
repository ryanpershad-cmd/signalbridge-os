import clsx from 'clsx';
import { getScoreBgColor } from '@/lib/scoring';

interface ScoreChipProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreChip({ score, showLabel = false, size = 'sm' }: ScoreChipProps) {
  const colorClass = getScoreBgColor(score);

  const label =
    score >= 4.0 ? 'Outperforming' :
    score >= 3.0 ? 'On Track' :
    score >= 2.0 ? 'Watch' : 'Intervention';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 border rounded font-mono font-semibold',
        colorClass,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' :
        size === 'md' ? 'px-2 py-1 text-[13px]' :
        'px-3 py-1.5 text-[16px]'
      )}
    >
      {score.toFixed(1)}
      {showLabel && <span className="font-sans font-normal text-[10px] ml-0.5">{label}</span>}
    </span>
  );
}
