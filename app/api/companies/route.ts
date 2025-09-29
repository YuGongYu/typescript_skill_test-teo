import { loadAnswers } from "../../../lib/data";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const answers = await loadAnswers();
  const seen = new Map<string, any>();
  for (const a of answers)
    if (!seen.has(a.company.isin)) seen.set(a.company.isin, a.company);

  return NextResponse.json([...seen.values()]);
}
