import React from "react";
import b from "../styles/badge.module.css";

export default function ScoreBadge({
  score,
  n,
}: {
  score: number | null | undefined;
  n?: number;
}) {
  if (score == null || Number.isNaN(score))
    return <span className={`${b.badge} ${b.muted}`}>No data</span>;
  const tone = score >= 75 ? b.emerald : score >= 50 ? b.amber : b.rose;
  return (
    <span className={`${b.badge} ${tone}`}>
      <span className={b.bold}>{score.toFixed(0)}</span>
      {typeof n === "number" && <span className={b.small}>n={n}</span>}
    </span>
  );
}
