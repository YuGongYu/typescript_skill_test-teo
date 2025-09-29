"use client";
import React from "react";
import Head from "next/head";
import s from "../styles/layout.module.css";
import { getJSON } from "../../lib/fetcher";
import Spinner from "../components/Spinner";
import { Card, CardBody, CardHeader } from "../components/Card";
import MultiLineChart from "../components/MultiLineChart";

type Answer = {
  created: string; // ISO
  value: number;
  company: { isin: string; title: string };
};
type Company = { isin: string; title: string };
type Bucket = "day" | "week" | "month" | "quarter";

export default function ComparePage() {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  // date range filters (YYYY-MM-DD)
  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");

  // time bucket
  const [bucket, setBucket] = React.useState<Bucket>("week");

  // cache of ALL answers per company (fetched once)
  const cacheRef = React.useRef<Map<string, Answer[]>>(new Map());
  const [cacheVersion, setCacheVersion] = React.useState(0); // bump to trigger recompute after fetches

  React.useEffect(() => {
    getJSON<Company[]>("/api/companies")
      .then(setCompanies)
      .finally(() => setLoading(false));
  }, []);

  // fetch all answers for a company (paginate until done). No start/end here.
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
        limit: String(limit),
        offset: String(offset),
      });
      const resp = await getJSON<any>(`/api/answers?${qs.toString()}`);
      if (signal?.aborted) throw new Error("aborted");
      const arr: Answer[] = resp.data ?? resp;
      out.push(...arr);
      const meta = resp.meta as { total?: number } | undefined;
      if (meta?.total != null) {
        if (out.length >= meta.total) break;
      } else if (arr.length < limit) {
        break;
      }
      offset += limit;
    }
    return out;
  }

  // ensure cache for all currently selected companies
  React.useEffect(() => {
    if (!selected.length) return;
    const ctrl = new AbortController();
    (async () => {
      const missing = selected.filter((isin) => !cacheRef.current.has(isin));
      if (missing.length === 0) return;
      await Promise.all(
        missing.map(async (isin) => {
          const all = await fetchAllAnswers(isin, ctrl.signal);
          cacheRef.current.set(isin, all);
        })
      );
      setCacheVersion((v) => v + 1);
    })().catch(() => {});
    return () => ctrl.abort();
  }, [selected]);

  // deterministic color per company
  const colorByCompany = React.useMemo(() => {
    const map = new Map<string, string>();
    const GOLDEN = 137.508;
    const hueFrom = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h % 360;
    };
    companies.forEach((c, i) => {
      const hue = (hueFrom(c.isin) + i * GOLDEN) % 360;
      map.set(c.isin, `hsl(${hue},70%,45%)`);
    });
    return map;
  }, [companies]);

  // --- bucketing helpers ---
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
    return iso.slice(0, 10);
  }

  // compute series from cached raw answers + current filters/bucket
  const series = React.useMemo(() => {
    const out: Record<string, Array<{ date: string; score: number }>> = {};
    for (const isin of selected) {
      const raw = cacheRef.current.get(isin);
      if (!raw) continue; // still loading this company
      const filtered = raw.filter((a) => {
        if (start && a.created < `${start}T00:00:00.000Z`) return false;
        if (end && a.created > `${end}T23:59:59.999Z`) return false;
        return true;
      });
      const agg = new Map<string, { sum: number; n: number }>();
      for (const a of filtered) {
        const k = keyForBucket(a.created, bucket);
        const cur = agg.get(k) || { sum: 0, n: 0 };
        agg.set(k, { sum: cur.sum + a.value, n: cur.n + 1 });
      }
      out[isin] = [...agg.entries()]
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([date, v]) => ({ date, score: v.sum / v.n }));
    }
    return out;
    // include cacheVersion to recompute after new fetches populate cache
  }, [selected, start, end, bucket, cacheVersion]);

  if (loading) return <Spinner />;

  return (
    <div className={s.container}>
      <Head>
        <title>Compare</title>
      </Head>
      <h1 className={s.title}>Compare companies</h1>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          margin: "8px 0 12px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 12, color: "#6b7280" }}>
          Start{" "}
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label style={{ fontSize: 12, color: "#6b7280" }}>
          End{" "}
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button
          className={s.button}
          onClick={() => {
            setStart("");
            setEnd("");
          }}
          title="Clear range"
        >
          Clear
        </button>
        <label style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
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

      {/* Company selector */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          margin: "12px 0 16px",
        }}
      >
        {companies.map((c) => {
          const active = selected.includes(c.isin);
          return (
            <button
              key={c.isin}
              onClick={() =>
                setSelected((x) =>
                  active ? x.filter((v) => v !== c.isin) : [...x, c.isin]
                )
              }
              className={`${s.button} ${active ? s.buttonActive : ""}`}
            >
              {c.title}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Mean score over time"
          subtitle={`Bucket: ${bucket}`}
        />
        <CardBody>
          {Object.keys(series).length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              Select companies to plot.
            </div>
          ) : (
            <MultiLineChart
              series={series}
              labels={Object.fromEntries(
                companies.map((c) => [c.isin, c.title])
              )}
              colorForKey={(isin) => colorByCompany.get(isin) || "#888"}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
