'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { MonthlyAggregate } from '@/lib/types';
import { formatMonthLabel } from '@/lib/formatters';

interface PortfolioTrendChartProps {
  data: MonthlyAggregate[];
  metric: 'revenue' | 'ebitda';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2535] border border-slate-700 rounded-lg px-3 py-2 text-[11px]">
      <p className="text-slate-400 mb-1">{formatMonthLabel(label)}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-mono">
          {entry.name}: ${entry.value?.toFixed(1)}M
        </p>
      ))}
    </div>
  );
};

export default function PortfolioTrendChart({ data, metric }: PortfolioTrendChartProps) {
  const actualKey = metric === 'revenue' ? 'revenue' : 'ebitda';
  const planKey = metric === 'revenue' ? 'revenuePlan' : 'ebitdaPlan';

  const chartData = data.map(d => ({
    ...d,
    label: d.month,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={formatMonthLabel}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={v => `$${v.toFixed(0)}M`}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
        />
        <Line
          type="monotone"
          dataKey={actualKey}
          name="Actual"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
        <Line
          type="monotone"
          dataKey={planKey}
          name="Plan"
          stroke="#334155"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 3, fill: '#334155' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
