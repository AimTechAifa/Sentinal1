/** Demo SSO display names aligned with seeded release owners */
export const DEMO_DISPLAY_NAMES: Record<string, string> = {
  "priya@company.com": "Priya Sharma",
  "jordan@company.com": "Jordan Lee",
  "guru@company.com": "Guru Sharma",
  "david@company.com": "David Frost",
  "emma@company.com": "Emma Walsh",
  "chris@company.com": "Chris Nguyen",
  "raj@company.com": "Raj Patel",
  "alex@company.com": "Alex Kim",
  "lisa@company.com": "Lisa Park",
};

export function resolveSessionName(email: string, fallback?: string): string {
  const normalized = email.trim().toLowerCase();
  if (DEMO_DISPLAY_NAMES[normalized]) return DEMO_DISPLAY_NAMES[normalized];
  if (fallback?.trim()) return fallback.trim();
  const local = normalized.split("@")[0] ?? "user";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function ownerMatches(sessionName: string, owner: string): boolean {
  const norm = sessionName.trim().toLowerCase();
  if (!norm) return false;
  const o = owner.toLowerCase();
  if (o.includes(norm) || norm.includes(o)) return true;
  const first = norm.split(/\s+/)[0];
  const ownerFirst = o.split(/\s+/)[0];
  return first.length > 2 && first === ownerFirst;
}
