// app/api/score/route.ts
import { NextResponse, NextRequest } from "next/server";
import type { Answer } from "../../../models";
import { loadAnswers } from "../../../lib/data";
import { parseISOOrNull } from "../../../lib/util";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const isin = sp.get("isin");
  const start = sp.get("start");
  const end = sp.get("end");

  if (!isin) {
    return NextResponse.json({ error: "isin required" }, { status: 400 });
  }

  let answers: Answer[] = await loadAnswers();
  answers = answers
    .filter((a) => a.company.isin === isin)
    .filter((a) => !a.skip);

  const startDate = parseISOOrNull(start || undefined);
  const endDate = parseISOOrNull(end || undefined);

  if (startDate && endDate) {
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    answers = answers.filter((a) => {
      const t = new Date(a.created).getTime();
      return t >= t0 && t < t1;
    });
  }

  if (answers.length === 0) {
    return NextResponse.json(
      { error: "no data for isin/date window" },
      { status: 404 }
    );
  }

  const score = answers.reduce((s, a) => s + a.value, 0) / answers.length;
  const company = answers[0].company;

  return NextResponse.json({
    company,
    score,
    n: answers.length,
  });
}
