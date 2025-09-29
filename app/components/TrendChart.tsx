import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function TrendChart({
  data,
}: {
  data: Array<{ date: string; score: number }>;
}) {
  const ticks = [0, 20, 40, 60, 80, 100];
  return (
    <div style={{ height: 256 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={20} />
          <YAxis
            domain={[0, 100]}
            ticks={ticks}
            width={30}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v: any) => (typeof v === "number" ? v.toFixed(1) : v)}
          />
          <Line type="monotone" dataKey="score" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
