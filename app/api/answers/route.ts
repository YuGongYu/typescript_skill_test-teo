import { NextRequest, NextResponse } from "next/server";
import { loadAnswers } from "../../../lib/data";
import { paginate, parseISOOrNull } from "../../../lib/util";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const isin = sp.get("isin") || undefined;
  const user = sp.get("user") || undefined;
  const start = parseISOOrNull(sp.get("start") || undefined);
  const end = parseISOOrNull(sp.get("end") || undefined);
  const idsParam = sp.get("ids") || undefined;
  const skipParam = sp.get("skip"); // "true" | "false" | null
  const limit = Number(sp.get("limit") ?? 0);
  const offset = Number(sp.get("offset") ?? 0);

  let data = await loadAnswers();

  if (isin) data = data.filter((a) => a.company.isin === isin);
  if (user) data = data.filter((a) => a.user === user);
  if (start) data = data.filter((a) => new Date(a.created) > start);
  if (end) data = data.filter((a) => new Date(a.created) < end);

  if (idsParam) {
    const ids = new Set(idsParam.split(",").map((s) => s.trim()));
    data = data.filter((a) => ids.has(a.id));
  }

  if (skipParam !== null) {
    if (skipParam === "true") data = data.filter((a) => a.skip === true);
    if (skipParam === "false") data = data.filter((a) => a.skip === false);
  }

  // deterministic order: newest first
  data.sort((a, b) => +new Date(b.created) - +new Date(a.created));

  const { items, limit: L, offset: O, total } = paginate(data, limit, offset);

  return NextResponse.json({
    data: items,
    meta: { total, limit: L, offset: O },
  });
}
