"use client";
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getJSON } from "../../../lib/fetcher";
import { Card, CardBody, CardHeader } from "../../components/Card";
import ScoreBadge from "../../components/ScoreBadge";
import Spinner from "../../components/Spinner";
import TrendChart from "../../components/TrendChart";
import type { Answer } from "../../../models";
import s from "../../styles/layout.module.css";
import c from "../../styles/card.module.css";
import { useParams } from "next/navigation";

type Bucket = "day" | "week" | "month" | "quarter";

export default function CompanyDetail() {
  const { isin } = useParams<{ isin?: string }>();

  const [loading, setLoading] = React.useState(true);
  const [company, setCompany] = React.useState<any>(null);
  const [score, setScore] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<Answer[]>([]);

  // chart bucketing
  const [bucket, setBucket] = React.useState<Bucket>("week");

  // table pagination (client side)
  const [pageSize, setPageSize] = React.useState<number>(50);
  const [page, setPage] = React.useState<number>(1);

  React.useEffect(() => {
    if (!isin) return;
    const ctrl = new AbortController();
    setLoading(true);
    (async () => {
      const [s1, all] = await Promise.all([
        getJSON<any>(`/api/score?isin=${encodeURIComponent(isin)}`),
        fetchAllAnswers(isin, ctrl.signal),
      ]);
      if (ctrl.signal.aborted) return;
      setCompany(s1.company);
      setScore(s1.score);
      setAnswers(all);
      setPage(1); // reset table page on company change
    })()
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [isin]);

  // -------- fetch all answers via limit/offset --------
  async function fetchAllAnswers(
    isin: string,
    signal?: AbortSignal
  ): Promise<Answer[]> {
    const limit = 1000;
    let offset = 0;
    const out: Answer[] = [];
    while (true) {
      const qs = new URLSearchParams({
        isin,
        skip: "false",
        limit: String(limit),
        offset: String(offset),
      });
      const resp = await getJSON<any>(`/api/answers?${qs.toString()}`);
      if (signal?.aborted) throw new Error("aborted");
      const page: Answer[] = resp.data ?? resp;
      out.push(...page);
      const meta = resp.meta as { total?: number } | undefined;
      if (meta?.total != null) {
        if (out.length >= meta.total) break;
      } else if (page.length < limit) {
        break;
      }
      offset += limit;
    }
    return out;
  }

  // -------- bucketing helpers --------
  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }
  function isoWeekKey(d: Date) {
    const dt = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    );
    const dayNum = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${dt.getUTCFullYear()}-W${pad(weekNo)}`;
  }
  function monthKey(d: Date) {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  }
  function quarterKey(d: Date) {
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    return `${d.getUTCFullYear()}-Q${q}`;
  }
  function keyForBucket(iso: string, mode: Bucket) {
    const d = new Date(iso);
    if (mode === "week") return isoWeekKey(d);
    if (mode === "month") return monthKey(d);
    if (mode === "quarter") return quarterKey(d);
    return iso.slice(0, 10); // day
  }

  // -------- series aggregated to selected bucket --------
  const series = React.useMemo(() => {
    const agg = new Map<string, { sum: number; n: number }>();
    for (const a of answers) {
      const k = keyForBucket(a.created, bucket);
      const v = agg.get(k) || { sum: 0, n: 0 };
      agg.set(k, { sum: v.sum + a.value, n: v.n + 1 });
    }
    return [...agg.entries()]
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([date, v]) => ({ date, score: v.sum / v.n }));
  }, [answers, bucket]);

  // -------- latest per question --------
  const latestByQuestion = React.useMemo(() => {
    const map = new Map<string, Answer>();
    for (const a of answers) {
      const qid = a.question.id;
      const prev = map.get(qid);
      if (!prev || new Date(a.created) > new Date(prev.created))
        map.set(qid, a);
    }
    return [...map.values()].sort((a, b) =>
      a.question.tag.localeCompare(b.question.tag)
    );
  }, [answers]);

  // -------- client-side pagination for answers table --------
  const total = answers.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pages);
  const offset = (clampedPage - 1) * pageSize;
  const visible = answers.slice(offset, offset + pageSize);

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(pages, p + 1));

  if (loading) return <Spinner />;
  if (!company) return <div className={s.container}>No data</div>;

  return (
    <>
      <Head>
        <title>{company.title}</title>
      </Head>
      <div className={s.container}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>{company.title}</h1>
            <p className={s.subtitle}>{company.isin}</p>
          </div>
          <ScoreBadge score={score} />
        </div>

        <Card>
          <CardHeader title={`Trend (${bucket} mean)`} subtitle="Simple mean" />
          <CardBody>
            {/* bucket selector */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: "#6b7280" }}>
                Bucket{" "}
                <select
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value as Bucket)}
                  style={{ marginLeft: 6 }}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                </select>
              </label>
            </div>
            <TrendChart data={series} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Latest per question" />
          <CardBody>
            <div className={s.grid}>
              {latestByQuestion.map((a) => (
                <div key={a.id} className={c.box}>
                  <div className={c.kv}>{a.question.tag}</div>
                  <div className={c.company}>{a.question.shortText}</div>
                  <div className={c.row} style={{ marginTop: 8 }}>
                    <ScoreBadge score={a.value} />
                    <span className={c.kv}>{a.created.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`Answers (${total})`} />
          <CardBody>
            {/* table */}
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
                  <th style={{ padding: "8px 0" }}>Question</th>
                  <th style={{ padding: "8px 0" }}>Value</th>
                  <th style={{ padding: "8px 0" }}>User</th>
                  <th style={{ padding: "8px 0" }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}>
                      {a.created.slice(0, 10)}
                    </td>
                    <td style={{ padding: "8px 0" }}>{a.question.shortText}</td>
                    <td style={{ padding: "8px 0" }}>{a.value}</td>
                    <td
                      style={{
                        padding: "8px 0",
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 12,
                      }}
                    >
                      <a
                        href={`/users/${a.user}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {a.user.slice(0, 8)}
                      </a>
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      <a href={a.source} target="_blank" rel="noreferrer">
                        link
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* pager */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                className={s.button}
                onClick={prev}
                disabled={clampedPage <= 1}
              >
                Prev
              </button>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {offset + 1}-{Math.min(offset + pageSize, total)} of {total}
              </div>
              <button
                className={s.button}
                onClick={next}
                disabled={clampedPage >= pages}
              >
                Next
              </button>
              <div
                style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}
              >
                Page size{" "}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
