'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendDirection } from '@/lib/types';

interface SparklineChartProps {
  data: { month: string; value: number }[];
  trend?: TrendDirection;
  height?: number;
}

export default function SparklineChart({ data, trend = 'flat', height = 40 }: SparklineChartProps) {
  const color = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#3b82f6';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-[#1e2535] border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300">
                {typeof payload[0]?.value === 'number' ? payload[0].value.toFixed(1) : payload[0]?.value}
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${trend})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
