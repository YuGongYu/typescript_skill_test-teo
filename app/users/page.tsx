"use client";
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { getJSON } from "../../lib/fetcher";
import s from "../styles/layout.module.css";

type Row = { user: string; answers: number };
type Resp = {
  data: Row[];
  meta: { total: number; limit: number; offset: number };
};

export default function UsersPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(50); // client default
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  async function load(nextOffset = offset, nextLimit = limit) {
    setLoading(true);
    const qs = new URLSearchParams({
      limit: String(nextLimit),
      offset: String(nextOffset),
    });
    const r = await getJSON<Resp>(`/api/users?${qs.toString()}`);
    setRows(r.data);
    setTotal(r.meta.total);
    setLimit(r.meta.limit || nextLimit);
    setOffset(r.meta.offset || nextOffset);
    setLoading(false);
  }

  React.useEffect(() => {
    load(0, limit);
  }, []); // initial

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const prev = () => {
    if (!canPrev) return;
    load(Math.max(0, offset - limit), limit);
  };
  const next = () => {
    if (!canNext) return;
    load(offset + limit, limit);
  };

  return (
    <>
      <Head>
        <title>Users</title>
      </Head>
      <div className={s.container}>
        <div className={s.header}>
          <h1 className={s.title}>Users</h1>
          <Link href="/companies" className={s.link}>
            Companies
          </Link>
        </div>

        {loading ? (
          <div className={s.center}>Loading…</div>
        ) : (
          <>
            <table
              style={{
                width: "100%",
                fontSize: 14,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ color: "#6b7280", textAlign: "left" }}>
                  <th style={{ padding: "8px 0" }}>User</th>
                  <th style={{ padding: "8px 0" }}>Answers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}>
                      <Link
                        href={`/users/${encodeURIComponent(r.user)}`}
                        className={s.link}
                      >
                        {r.user}
                      </Link>
                    </td>
                    <td style={{ padding: "8px 0" }}>{r.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button onClick={prev} disabled={!canPrev} className={s.button}>
                Prev
              </button>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {offset + 1}-{Math.min(offset + limit, total)} of {total}
              </div>
              <button onClick={next} disabled={!canNext} className={s.button}>
                Next
              </button>

              {/* optional: page-size selector */}
              <select
                value={limit}
                onChange={(e) => load(0, Number(e.target.value))}
                style={{ marginLeft: "auto" }}
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </>
  );
}
