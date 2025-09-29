"use client";

import React from "react";
import Head from "next/head";

import { getJSON } from "../../../lib/fetcher";
import s from "../../styles/layout.module.css";
import { Card, CardBody, CardHeader } from "../../components/Card";
import Spinner from "../../components/Spinner";
import MultiLineChart from "../../components/MultiLineChart";
import type { Answer } from "../../../models";
import ScoreBadge from "../../components/ScoreBadge";
import Segmented from "../../components/Segmented";
import { questionLabel } from "../../../lib/i18n";
import { useParams } from "next/navigation";

export default function UserDetail() {
  const { user } = useParams<{ user?: string }>();
  const userId = user as string | undefined;
  const [mode, setMode] = React.useState<"company" | "question">("company");

  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState<Answer[]>([]);

  const colorByCompany = React.useMemo(() => {
    const map = new Map<string, string>();

    const seen = new Set<string>();
    for (const a of answers)
      if (!seen.has(a.company.isin)) {
        seen.add(a.company.isin);

        map.set(a.company.isin, `hsl(${60 + 60 * seen.size},70%,45%)`);
      }
    return map;
  }, [answers]);

  const companySeries = React.useMemo(() => {
    const bucket = new Map<string, Map<string, { sum: number; n: number }>>();
    const names: Record<string, string> = {};
    for (const a of answers) {
      const key = a.company.isin;
      const day = a.created.slice(0, 10);
      if (!bucket.has(key)) bucket.set(key, new Map());
      const m = bucket.get(key)!;
      const cur = m.get(day) || { sum: 0, n: 0 };
      m.set(day, { sum: cur.sum + a.value, n: cur.n + 1 });
      names[key] = a.company.title;
    }
    const out: Record<string, Array<{ date: string; score: number }>> = {};
    for (const [key, m] of bucket) {
      out[key] = [...m.entries()]
        .sort(([d1], [d2]) => d1.localeCompare(d2))
        .map(([date, v]) => ({ date, score: v.sum / v.n }));
    }
    return { series: out, names };
  }, [answers]);

  // --- question mode: key = `${isin}::${qid}`
  const questionSeries = React.useMemo(() => {
    const bucket = new Map<string, Map<string, { sum: number; n: number }>>();
    const names: Record<string, string> = {};
    for (const a of answers) {
      const key = `${a.company.isin}::${a.question.id}`;
      const day = a.created.slice(0, 10);
      if (!bucket.has(key)) bucket.set(key, new Map());
      const m = bucket.get(key)!;
      const cur = m.get(day) || { sum: 0, n: 0 };
      m.set(day, { sum: cur.sum + a.value, n: cur.n + 1 });
      names[key] = `${a.company.title} — ${questionLabel(a.question)}`;
    }
    const out: Record<string, Array<{ date: string; score: number }>> = {};
    for (const [key, m] of bucket) {
      out[key] = [...m.entries()]
        .sort(([d1], [d2]) => d1.localeCompare(d2))
        .map(([date, v]) => ({ date, score: v.sum / v.n }));
    }
    return { series: out, names };
  }, [answers]);

  // dash pattern per question id
  const dashForQ = (qid: string) => {
    const patterns = ["", "5 5", "8 4", "2 4", "12 4", "2 2 6 2"];
    let x = 0;
    for (let i = 0; i < qid.length; i++) x = (x * 33 + qid.charCodeAt(i)) >>> 0;
    return patterns[x % patterns.length];
  };
  React.useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getJSON<any>(`/api/answers?user=${encodeURIComponent(userId)}&limit=2000`)
      .then((d) => setAnswers(d.data ?? d))
      .finally(() => setLoading(false));
  }, [userId]);

  // Build daily mean per company for this user
  const series = React.useMemo(() => {
    // Map: company.isin -> Map<YYYY-MM-DD, {sum, n}>
    const bucket = new Map<string, Map<string, { sum: number; n: number }>>();
    for (const a of answers) {
      const isin = a.company.isin;
      const day = a.created.slice(0, 10);
      if (!bucket.has(isin)) bucket.set(isin, new Map());
      const m = bucket.get(isin)!;
      const cur = m.get(day) || { sum: 0, n: 0 };
      m.set(day, { sum: cur.sum + a.value, n: cur.n + 1 });
    }
    const out: Record<string, Array<{ date: string; score: number }>> = {};
    for (const [isin, m] of bucket.entries()) {
      const arr = [...m.entries()]
        .sort(([d1], [d2]) => d1.localeCompare(d2))
        .map(([date, v]) => ({ date, score: v.sum / v.n }));
      out[isin] = arr;
    }
    return out;
  }, [answers]);

  // Labels map ISIN -> company name
  const labels = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of answers) map[a.company.isin] = a.company.title;
    return map;
  }, [answers]);

  // Per-company latest mean and totals
  const perCompanyStats = React.useMemo(() => {
    const map = new Map<
      string,
      { title: string; count: number; mean: number }
    >();
    const buckets = new Map<string, { sum: number; n: number }>();
    for (const a of answers) {
      const k = a.company.isin;
      buckets.set(k, {
        sum: (buckets.get(k)?.sum ?? 0) + a.value,
        n: (buckets.get(k)?.n ?? 0) + 1,
      });
      map.set(k, {
        title: a.company.title,
        count: (map.get(k)?.count ?? 0) + 1,
        mean: 0,
      });
    }
    const out: Array<{
      isin: string;
      title: string;
      count: number;
      mean: number;
    }> = [];
    for (const [isin, agg] of buckets.entries()) {
      const m = map.get(isin)!;
      out.push({ isin, title: m.title, count: m.count, mean: agg.sum / agg.n });
    }
    out.sort((a, b) => b.count - a.count);
    return out;
  }, [answers]);

  if (loading) return <Spinner />;
  if (!userId) return <div className={s.container}>No user</div>;

  return (
    <>
      <Head>
        <title>User {userId.slice(0, 12)}…</title>
      </Head>
      <div className={s.container}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>User {userId.slice(0, 12)}…</h1>
            <p className={s.subtitle}>Answers: {answers.length}</p>
          </div>
        </div>
        <div style={{ margin: "8px 0 12px" }}>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as any)}
            options={[
              { label: "Company", value: "company" },
              { label: "Question breakdown", value: "question" },
            ]}
          />
        </div>
        <Card>
          <CardHeader
            title="Combined sentiment trend"
            subtitle="Daily mean per company for this user"
          />

          <CardBody>
            {Object.keys(series).length === 0 ? (
              <div>No data</div>
            ) : mode === "company" ? (
              <MultiLineChart
                series={companySeries.series}
                labels={companySeries.names}
                colorForKey={(key) => colorByCompany.get(key) || "#888"}
              />
            ) : (
              <MultiLineChart
                series={questionSeries.series}
                labels={questionSeries.names}
                colorForKey={(key) => {
                  const isin = key.split("::")[0];
                  return colorByCompany.get(isin) || "#888";
                }}
                dashForKey={(key) => dashForQ(key.split("::")[1])}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Companies answered by this user" />
          <CardBody>
            <table
              style={{
                width: "100%",
                fontSize: 14,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ color: "#6b7280", textAlign: "left" }}>
                  <th style={{ padding: "8px 0" }}>Company</th>
                  <th style={{ padding: "8px 0" }}>ISIN</th>
                  <th style={{ padding: "8px 0" }}>Answers</th>
                  <th style={{ padding: "8px 0" }}>Mean</th>
                </tr>
              </thead>
              <tbody>
                {perCompanyStats.map((r) => (
                  <tr key={r.isin} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}>{r.title}</td>
                    <td style={{ padding: "8px 0" }}>{r.isin}</td>
                    <td style={{ padding: "8px 0" }}>{r.count}</td>
                    <td style={{ padding: "8px 0" }}>
                      <ScoreBadge score={r.mean} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent answers (user)" />
          <CardBody>
            <table
              style={{
                width: "100%",
                fontSize: 14,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ color: "#6b7280", textAlign: "left" }}>
                  <th style={{ padding: "8px 0" }}>Date</th>
                  <th style={{ padding: "8px 0" }}>Company</th>
                  <th style={{ padding: "8px 0" }}>Question</th>
                  <th style={{ padding: "8px 0" }}>Value</th>
                  <th style={{ padding: "8px 0" }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {answers
                  .slice()
                  .sort((a, b) => +new Date(b.created) - +new Date(a.created))
                  .slice(0, 100)
                  .map((a) => (
                    <tr key={a.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 0" }}>
                        {a.created.slice(0, 10)}
                      </td>
                      <td style={{ padding: "8px 0" }}>{a.company.title}</td>
                      <td style={{ padding: "8px 0" }}>
                        {a.question.shortText}
                      </td>
                      <td style={{ padding: "8px 0" }}>{a.value}</td>
                      <td style={{ padding: "8px 0" }}>
                        <a href={a.source} target="_blank" rel="noreferrer">
                          link
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
