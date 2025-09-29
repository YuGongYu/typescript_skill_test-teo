import React from "react";
import c from "../styles/card.module.css";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className={c.card}>{children}</div>;
}
export function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={c.header}>
      <h3 className={c.hTitle}>{title}</h3>
      {subtitle && <p className={c.hSub}>{subtitle}</p>}
    </div>
  );
}
export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${c.body} ${className || ""}`}>{children}</div>;
}
