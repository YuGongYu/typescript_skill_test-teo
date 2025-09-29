// app/api/answers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loadAnswers } from "../../../../lib/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id?: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const answers = await loadAnswers();
  const hit = answers.find((a: any) => a.id === id);
  if (!hit) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(hit);
}
