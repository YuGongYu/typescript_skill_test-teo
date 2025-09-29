"use client";
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { getJSON } from "../../lib/fetcher";
import CompanyCard from "../components/CompanyCard";
import Spinner from "../components/Spinner";
import s from "../styles/layout.module.css";

export default function CompaniesPage() {
  const [companies, setCompanies] = React.useState<Array<any>>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getJSON<Array<any>>("/api/companies")
      .then(setCompanies)
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter((c: any) =>
    (c.title + " " + c.isin).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Companies</title>
      </Head>
      <div className={s.container}>
        <div className={s.header}>
          <h1 className={s.title}>Companies</h1>
          <Link href="/compare" className={s.link}>
            Compare
          </Link>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or ISIN"
          className={s.search}
        />

        {loading ? (
          <Spinner />
        ) : (
          <div className={s.grid}>
            {filtered.map((c: any) => (
              <CompanyCard key={c.isin} company={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
