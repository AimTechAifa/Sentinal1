export type StakeholderCommsContext = {
  releaseCode: string;
  name: string;
  owner: string;
  status: string;
  releaseDate: string;
  department: string;
  readiness: number;
  blockerCount: number;
  decision: string | null;
  downstreamCount: number;
  openWorkItems: number;
  slipSummary: string | null;
};

export function buildFallbackComms(ctx: StakeholderCommsContext): string {
  const lines = [
    `Release update: ${ctx.releaseCode} — ${ctx.name}`,
    `Target: ${new Date(ctx.releaseDate).toLocaleDateString("en-AU")} · Status: ${ctx.status} · Owner: ${ctx.owner}`,
    `Readiness: ${ctx.readiness}%${ctx.blockerCount ? ` · ${ctx.blockerCount} open blocker(s)` : ""}${ctx.decision ? ` · Decision: ${ctx.decision}` : ""}.`,
  ];
  if (ctx.downstreamCount > 0) {
    lines.push(`${ctx.downstreamCount} downstream release(s) may be affected if we slip.`);
  }
  if (ctx.openWorkItems > 0) {
    lines.push(`${ctx.openWorkItems} Jira item(s) still open for this release code.`);
  }
  if (ctx.slipSummary) {
    lines.push(ctx.slipSummary);
  }
  lines.push("Next update: standup / release desk.");
  return lines.join("\n\n");
}
