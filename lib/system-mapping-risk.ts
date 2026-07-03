import type { MappingEdgeRow, MappingRisk } from "@/lib/system-mapping-types";

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd;
}

type BookingRow = {
  applicationId: string;
  environmentId: string | null;
  bookedBy: string;
  team: string;
  fromDate: Date;
  toDate: Date;
  purpose: string | null;
  status: string;
  application: { name: string };
  environment: { name: string } | null;
};

type EdgeWithMeta = MappingEdgeRow & {
  id: string;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
};

export function analyseMappingRisks(
  edges: EdgeWithMeta[],
  bookings: BookingRow[],
  fromDate: Date,
  toDate: Date
): MappingRisk[] {
  const active = bookings.filter((b) => (b.status ?? "BOOKED") === "BOOKED");

  return edges.flatMap((edge) => {
    const risks: MappingRisk[] = [];

    const checkEnv = (
      appId: string,
      envId: string,
      appName: string,
      envName: string,
      role: "source" | "target"
    ) => {
      const conflict = active.find(
        (b) =>
          b.applicationId === appId &&
          (!b.environmentId || b.environmentId === envId) &&
          overlaps(fromDate, toDate, b.fromDate, b.toDate)
      );
      if (!conflict) return;

      risks.push({
        edgeId: edge.id,
        groupId: edge.groupId ?? edge.group?.id ?? null,
        groupName: edge.group?.name ?? null,
        source: `${edge.sourceApp?.name ?? "?"} / ${edge.sourceEnv?.name ?? "?"}`,
        target: `${edge.targetApp?.name ?? "?"} / ${edge.targetEnv?.name ?? "?"}`,
        direction: edge.direction,
        notes: edge.notes ?? null,
        risk: `${role === "target" ? "Downstream" : "Upstream"} environment ${envName} (${appName}) is booked by ${conflict.bookedBy} (${conflict.team}) during the selected period`,
        bookedBy: conflict.bookedBy,
        team: conflict.team,
        fromDate: conflict.fromDate.toISOString(),
        toDate: conflict.toDate.toISOString(),
        purpose: conflict.purpose,
        conflictEnv: `${appName} / ${envName}`,
      });
    };

    checkEnv(
      edge.targetAppId,
      edge.targetEnvId,
      edge.targetApp?.name ?? "?",
      edge.targetEnv?.name ?? "?",
      "target"
    );
    checkEnv(
      edge.sourceAppId,
      edge.sourceEnvId,
      edge.sourceApp?.name ?? "?",
      edge.sourceEnv?.name ?? "?",
      "source"
    );

    return risks;
  });
}
