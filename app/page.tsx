"use client";
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { getJSON } from "../lib/fetcher";
import CompanyCard from "./components/CompanyCard";
import s from "./styles/layout.module.css";
import { Card, CardBody, CardHeader } from "./components/Card";

type UserRow = { user: string; answers: number };

export default function Home() {
  const [companies, setCompanies] = React.useState<Array<any>>([]);
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [usersMeta, setUsersMeta] = React.useState<{
    total: number;
    limit: number;
    offset: number;
  }>({ total: 0, limit: 0, offset: 0 });
  const [scores, setScores] = React.useState<
    Record<string, { score: number; n: number }>
  >({});

  React.useEffect(() => {
    (async () => {
      // companies
      const cs = await getJSON<Array<any>>("/api/companies");
      setCompanies(cs);

      // users (first page) to show recent/active and get total meta
      const ur = await getJSON<{
        data: UserRow[];
        meta: { total: number; limit: number; offset: number };
      }>("/api/users?limit=10&offset=0");
      setUsers(ur.data ?? []);
      setUsersMeta(ur.meta ?? { total: 0, limit: 0, offset: 0 });

      // spotlight: first 6 companies’ overall score (no date filter)
      const top = cs.slice(0, 6);
      const entries = await Promise.all(
        top.map(async (c: any) => {
          try {
            const r = await getJSON<{ company: any; score: number; n: number }>(
              `/api/score?isin=${encodeURIComponent(c.isin)}`
            );
            return [c.isin, { score: r.score, n: r.n }] as const;
          } catch {
            return [c.isin, { score: NaN, n: 0 }] as const;
          }
        })
      );
      setScores(Object.fromEntries(entries));
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Survey Dashboard</title>
      </Head>
      <div className={s.container}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Survey Dashboard</h1>
            <p className={s.subtitle}>
              Crowd sentiment on companies. Fast overview and deep dives.
            </p>
          </div>
          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/companies" className={s.button}>
              Companies
            </Link>
            <Link href="/users" className={s.button}>
              Users
            </Link>
            <Link href="/compare" className={s.button}>
              Compare
            </Link>
          </nav>
        </div>

        {/* Key stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Stat label="Companies" value={companies.length} />
          <Stat label="Users" value={usersMeta.total} />
          <Stat label="Spotlight range" value="All-time" />
        </div>

        {/* Spotlight companies */}
        <Card>
          <CardHeader
            title="Spotlight"
            subtitle="Live mean score per company"
          />
          <CardBody>
            <div className={s.grid}>
              {companies.map((c: any) => (
                <div
                  key={c.isin}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <CompanyCard company={c} score={scores[c.isin]?.score} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent users */}
        <Card>
          <CardHeader
            title="Active users"
            subtitle="Top by answers (first page)"
          />
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
                  <th style={{ padding: "8px 0" }}>User</th>
                  <th style={{ padding: "8px 0" }}>Answers</th>
                  <th style={{ padding: "8px 0" }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}>{u.user}</td>
                    <td style={{ padding: "8px 0" }}>{u.answers}</td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>
                      <Link
                        href={`/users/${encodeURIComponent(u.user)}`}
                        className={s.link}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Showing {users.length} of {usersMeta.total}.{" "}
              <Link href="/users" className={s.link}>
                See all users →
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Deep links */}
        <Card>
          <CardHeader title="Explore" />
          <CardBody>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              <LinkBox
                href="/companies"
                title="Browse companies"
                desc="Search and open company detail pages."
              />
              <LinkBox
                href="/compare"
                title="Compare companies"
                desc="Overlay sentiment trends across firms."
              />
              <LinkBox
                href="/users"
                title="User analytics"
                desc="Rank users and inspect individual timelines."
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

/* Small presentational helpers */
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function LinkBox({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className={s.cardLink} style={{ textDecoration: "none" }}>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: "#fff",
          height: "100%",
        }}
      >
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          {desc}
        </div>
      </div>
    </Link>
  );
}
