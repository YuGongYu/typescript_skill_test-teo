export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    let err: any = { status: res.status, statusText: res.statusText };
    try {
      err.body = await res.json();
    } catch {}
    throw err;
  }
  return res.json();
}
