// lib/util.ts
export function parseISOOrNull(s?: string) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function paginate<T>(arr: T[], limit = 100, offset = 0) {
  const l = Math.max(1, Math.min(1000, Number(limit) || 100));
  const o = Math.max(0, Number(offset) || 0);
  return { items: arr.slice(o, o + l), limit: l, offset: o, total: arr.length };
}
