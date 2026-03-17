'use client';

import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MonthlyFinancials } from '@/lib/types';
import { formatMonthLabel } from '@/lib/formatters';

interface CompanyOverviewChartProps {
  financials: MonthlyFinancials[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2535] border border-slate-700 rounded-lg px-3 py-2 text-[11px]">
      <p className="text-slate-400 mb-1 font-medium">{formatMonthLabel(label)}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color ?? entry.fill }} className="font-mono">
          {entry.name}: {
            entry.name.includes('Margin')
              ? `${entry.value?.toFixed(1)}%`
              : `$${entry.value?.toFixed(1)}M`
          }
        </p>
      ))}
    </div>
  );
};

export default function CompanyOverviewChart({ financials }: CompanyOverviewChartProps) {
  const data = financials.map(m => ({
    month: m.month,
    revenue: m.revenue,
    revenuePlan: m.revenuePlan,
    ebitda: m.ebitda,
    ebitdaMargin: m.ebitdaMargin,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={formatMonthLabel}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={v => `$${v}M`}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <YAxis
          yAxisId="margin"
          orientation="right"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={v => `${v}%`}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
        <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#3b82f6" opacity={0.8} radius={[2,2,0,0]} />
        <Bar yAxisId="revenue" dataKey="revenuePlan" name="Revenue Plan" fill="#1e293b" radius={[2,2,0,0]} />
        <Line
          yAxisId="margin"
          type="monotone"
          dataKey="ebitdaMargin"
          name="EBITDA Margin"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
