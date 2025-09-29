// components/MultiLineChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function MultiLineChart({
  series,
  labels,
  colorForKey,
  dashForKey,
}: {
  series: Record<string, Array<{ date: string; score: number }>>;
  labels?: Record<string, string>;
  colorForKey?: (key: string) => string;
  dashForKey?: (key: string) => string; // e.g. "5 5"
}) {
  const dates = new Set<string>();
  Object.values(series).forEach((arr) => arr.forEach((p) => dates.add(p.date)));
  const x = [...dates].sort((a, b) => a.localeCompare(b));
  const merged = x.map((date) => {
    const row: any = { date };
    for (const key of Object.keys(series)) {
      const hit = series[key].find((p) => p.date === date);
      if (hit) row[key] = hit.score;
    }
    return row;
  });
  const keys = Object.keys(series);

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={merged}
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={20} />
          <YAxis domain={[0, 100]} width={30} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {keys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={labels?.[key] ?? key}
              dot={{ r: 4 }}
              strokeWidth={2}
              connectNulls
              stroke={colorForKey?.(key)}
              strokeDasharray={dashForKey?.(key)}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
