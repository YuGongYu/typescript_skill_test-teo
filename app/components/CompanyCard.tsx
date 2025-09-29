import React from "react";
import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import { Card, CardBody } from "./Card";
import c from "../styles/card.module.css";

interface Props {
  company: { title: string; isin: string };
  score?: number | null;
  n?: number;
}
export default function CompanyCard({ company, score, n }: Props) {
  console.log("company", company);
  return (
    <Link href={`/companies/${company.isin}`} className="block">
      <Card>
        <CardBody>
          <div className={c.row}>
            <div>
              <div className={c.company}>{company.title}</div>
              <div className={c.isin}>{company.isin}</div>
            </div>
            <ScoreBadge score={score ?? null} n={n} />
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
