'use client';

import Link from 'next/link';
import { Company } from '@/lib/types';
import { getScoreCellColor } from '@/lib/scoring';
import StatusBadge from '@/components/ui/StatusBadge';

interface HeatmapTableProps {
  companies: Company[];
}

const dimensions: { key: keyof Omit<ReturnType<() => Company['frameworkScore']>, 'overall' | 'trend'>; label: string }[] = [
  { key: 'financial', label: 'Financial' },
  { key: 'growth', label: 'Growth' },
  { key: 'operational', label: 'Ops' },
  { key: 'talent', label: 'Talent' },
  { key: 'customer', label: 'Customer' },
  { key: 'strategic', label: 'Strategic' },
  { key: 'risk', label: 'Risk' },
];

export default function HeatmapTable({ companies }: HeatmapTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr>
            <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium w-48">
              Company
            </th>
            {dimensions.map(d => (
              <th key={d.key} className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium text-center w-20">
                {d.label}
              </th>
            ))}
            <th className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium text-center w-20">
              Overall
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {companies.map(company => (
            <tr key={company.slug} className="hover:bg-slate-800/20 transition-colors group">
              <td className="px-4 py-3">
                <Link href={`/company/${company.slug}`} className="group-hover:text-blue-400 transition-colors">
                  <div className="font-medium text-slate-200 text-[13px]">{company.name}</div>
                  <div className="mt-1">
                    <StatusBadge status={company.status} />
                  </div>
                </Link>
              </td>
              {dimensions.map(d => {
                const score = company.frameworkScore[d.key as keyof typeof company.frameworkScore] as number;
                return (
                  <td key={d.key} className="px-3 py-3 text-center">
                    <span className={`inline-block w-8 h-7 rounded text-[12px] font-mono font-semibold leading-7 ${getScoreCellColor(score)}`}>
                      {score.toFixed(0)}
                    </span>
                  </td>
                );
              })}
              <td className="px-3 py-3 text-center">
                <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[13px] ${getScoreCellColor(company.frameworkScore.overall)}`}>
                  {company.frameworkScore.overall.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
