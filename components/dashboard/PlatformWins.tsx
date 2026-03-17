import { CheckCircle2, TrendingUp } from 'lucide-react';

interface PlatformWinsProps {
  wins: string[];
}

export default function PlatformWins({ wins }: PlatformWinsProps) {
  return (
    <div className="space-y-2">
      {wins.map((win, idx) => (
        <div key={idx} className="bg-green-500/5 border border-green-500/15 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-slate-300 leading-relaxed">{win}</p>
        </div>
      ))}
    </div>
  );
}
