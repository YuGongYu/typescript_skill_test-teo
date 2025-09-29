import { NextResponse, NextRequest } from "next/server";
import { loadAnswers } from "../../../lib/data";
import { paginate } from "../../../lib/util";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const all = await loadAnswers();
  const valid = all.filter((a) => !a.skip);

  const counts = new Map<string, number>();
  for (const a of valid) counts.set(a.user, (counts.get(a.user) ?? 0) + 1);

  const rows = [...counts.entries()]
    .map(([user, answers]) => ({ user, answers }))
    .sort((a, b) => b.answers - a.answers);

  const { items, limit: l, offset: o, total } = paginate(rows, limit, offset);
  return NextResponse.json({
    data: items,
    meta: { total, limit: l, offset: o },
  });
}
