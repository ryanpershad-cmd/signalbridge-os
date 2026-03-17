import { FunctionalScore } from '@/lib/types';
import { getScoreBgColor } from '@/lib/scoring';
import TrendArrow from '@/components/ui/TrendArrow';
import clsx from 'clsx';

interface FunctionalScoresProps {
  scores: FunctionalScore[];
}

const functionLabels: Record<string, string> = {
  GTM: 'Go-To-Market',
  Finance: 'Finance',
  Operations: 'Operations',
  People: 'People & Talent',
  Technology: 'Technology',
};

export default function FunctionalScores({ scores }: FunctionalScoresProps) {
  return (
    <div className="space-y-3">
      {scores.map(score => (
        <div key={score.function} className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-center w-14">
              <span className={clsx(
                'inline-block px-2 py-1 rounded font-mono font-bold text-[16px] border',
                getScoreBgColor(score.score)
              )}>
                {score.score.toFixed(1)}
              </span>
              <div className="mt-1">
                <TrendArrow direction={score.trend} size={12} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-200 mb-1">
                {functionLabels[score.function] ?? score.function}
              </p>
              <p className="text-[12px] text-slate-400 leading-relaxed">{score.commentary}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
