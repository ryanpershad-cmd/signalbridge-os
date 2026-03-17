import { FileText } from 'lucide-react';

interface ExecutiveBriefProps {
  bullets: string[];
}

export default function ExecutiveBrief({ bullets }: ExecutiveBriefProps) {
  return (
    <div className="space-y-3">
      {bullets.map((bullet, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
            {idx + 1}
          </span>
          <p className="text-[12px] text-slate-300 leading-relaxed">{bullet}</p>
        </div>
      ))}
    </div>
  );
}
