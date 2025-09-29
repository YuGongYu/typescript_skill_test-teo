import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from "recharts";

type Point = {
  t: number; // timestamp (ms) + jitter
  date: string; // YYYY-MM-DD
  value: number; // 0..100
  company: string; // ISIN
  companyTitle: string;
  questionId: string;
  questionShort: string;
  source: string;
};

const GOLDEN_ANGLE = 137.508;
function hueFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
function colorForCompany(key: string, idx: number) {
  const hue = (hueFromString(key) + idx * GOLDEN_ANGLE) % 360;
  return `hsl(${hue},70%,45%)`;
}

type ShapeName = "circle" | "square" | "triangle" | "diamond" | "wye" | "cross";
const SHAPES: ShapeName[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "wye",
  "cross",
];
function shapeForQuestion(qid: string): ShapeName {
  let x = 0;
  for (let i = 0; i < qid.length; i++) x = (x * 33 + qid.charCodeAt(i)) >>> 0;
  return SHAPES[x % SHAPES.length];
}

// Custom per-point glyph
function Glyph(props: any) {
  const { cx, cy, payload, fill } = props as {
    cx: number;
    cy: number;
    payload: Point;
    fill: string;
  };
  const r = 4;
  const s = shapeForQuestion(payload.questionId);
  switch (s) {
    case "square":
      return (
        <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill={fill} />
      );
    case "triangle":
      return (
        <path
          d={`M ${cx} ${cy - r} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`}
          fill={fill}
        />
      );
    case "diamond":
      return (
        <path
          d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${
            cx - r
          } ${cy} Z`}
          fill={fill}
        />
      );
    case "wye":
      return (
        <path
          d={`M ${cx} ${cy - r} L ${cx} ${cy + r} M ${cx - r} ${cy} L ${
            cx + r
          } ${cy}`}
          stroke={fill}
          strokeWidth={2}
        />
      );
    case "cross":
      return (
        <path
          d={`M ${cx - r} ${cy - r} L ${cx + r} ${cy + r} M ${cx - r} ${
            cy + r
          } L ${cx + r} ${cy - r}`}
          stroke={fill}
          strokeWidth={2}
        />
      );
    default:
      return <circle cx={cx} cy={cy} r={r} fill={fill} />;
  }
}

export default function UserSentimentScatter({
  answers,
}: {
  answers: Array<{
    created: string;
    value: number;
    source: string;
    company: { isin: string; title: string };
    question: { id: string; shortText: string };
  }>;
}) {
  if (!answers || answers.length === 0) return <div>No data</div>;

  // Points with stable ±12h jitter by question id (separate same-day dots)
  const jitterMs = 12 * 60 * 60 * 1000;
  const rows: Point[] = answers.map((a) => {
    const day = a.created.slice(0, 10);
    const base = new Date(`${day}T12:00:00Z`).getTime();
    let j = 0;
    for (let i = 0; i < a.question.id.length; i++)
      j = (j * 31 + a.question.id.charCodeAt(i)) >>> 0;
    const offset = ((j % 2001) / 2000 - 0.5) * 2 * jitterMs; // [-12h, +12h]
    return {
      t: base + offset,
      date: day,
      value: a.value,
      company: a.company.isin,
      companyTitle: a.company.title,
      questionId: a.question.id,
      questionShort: a.question.shortText,
      source: a.source,
    };
  });

  // Group by company
  const byCo = new Map<string, Point[]>();
  const titles = new Map<string, string>();
  for (const p of rows) {
    if (!byCo.has(p.company)) byCo.set(p.company, []);
    byCo.get(p.company)!.push(p);
    titles.set(p.company, p.companyTitle);
  }
  for (const arr of byCo.values()) arr.sort((a, b) => a.t - b.t);

  // Domains
  const tMin = Math.min(...rows.map((r) => r.t));
  const tMax = Math.max(...rows.map((r) => r.t));

  return (
    <div style={{ height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* IMPORTANT: give both axes dataKey and type=number */}
          <XAxis
            type="number"
            dataKey="t"
            domain={[tMin, tMax]}
            tickFormatter={(ms) => new Date(ms).toISOString().slice(0, 10)}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="value"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            width={30}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            formatter={(val: any, _name, ctx: any) => {
              const p = ctx.payload as Point;
              return [
                typeof val === "number" ? val.toFixed(0) : val,
                `${p.companyTitle} • ${p.questionShort}`,
              ];
            }}
            labelFormatter={(ms: any) =>
              new Date(ms).toISOString().slice(0, 10)
            }
          />
          <Legend />
          {[...byCo.entries()].map(([isin, data], i) => (
            <Scatter
              key={isin}
              name={titles.get(isin) ?? isin}
              data={data}
              fill={colorForCompany(isin, i)}
              shape={<Glyph />}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
