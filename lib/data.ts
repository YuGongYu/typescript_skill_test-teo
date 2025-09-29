// lib/data.ts
import { promises as fs } from "fs";
import path from "path";
import type { Answer } from "../models";

let cache: { data: Answer[]; mtimeMs: number } | null = null;
const DATA_PATH = path.resolve(process.cwd(), "data.json");

export async function loadAnswers(): Promise<Answer[]> {
  const stat = await fs.stat(DATA_PATH);
  if (cache && cache.mtimeMs === stat.mtimeMs) return cache.data;
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const data = JSON.parse(raw) as Answer[];
  cache = { data, mtimeMs: stat.mtimeMs };
  return data;
}
