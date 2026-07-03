/** Generate a unique release ID in the form REL-YYYY-0001. */
export function generateReleaseId(existingCodes: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `REL-${year}-`;
  const taken = new Set(existingCodes.map((c) => c.toUpperCase()));

  const seqNumbers = existingCodes
    .filter((c) => c.toUpperCase().startsWith(prefix))
    .map((c) => parseInt(c.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));

  let seq = seqNumbers.length > 0 ? Math.max(...seqNumbers) + 1 : 1;

  for (let attempt = 0; attempt < 10_000; attempt++) {
    const candidate = `${prefix}${String(seq).padStart(4, "0")}`;
    if (!taken.has(candidate.toUpperCase())) return candidate;
    seq += 1;
  }

  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

export function normalizeProgramProject(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /^n\/a$/i.test(trimmed)) return "N/A";
  return trimmed;
}
