export async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();
  let data: { error?: string } | T | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid server response");
    }
  }
  if (!res.ok) {
    const err = data && typeof data === "object" && "error" in data ? data.error : null;
    throw new Error(err ?? `Request failed (${res.status})`);
  }
  return data as T;
}
