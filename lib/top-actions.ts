import type { DbReleasePrediction } from "./db-predictive";
import type { InboxItem } from "./inbox-shared";
import { ownerMatches } from "./user-match";

export type TodayAction = {
  rank: number;
  label: string;
  detail: string;
  href: string;
  urgency: "critical" | "high" | "normal";
  kind: "blocker" | "booking" | "decision" | "p1" | "prediction";
};

export type ReleasePredictionRow = {
  releaseCode: string;
  name: string;
  href: string;
  owner: string;
  prediction: DbReleasePrediction;
};

const URGENCY_ORDER = { critical: 0, high: 1, normal: 2 };

export function buildTopActionsToday(
  inboxItems: InboxItem[],
  predictions: ReleasePredictionRow[],
  sessionName: string
): TodayAction[] {
  const candidates: Omit<TodayAction, "rank">[] = [];

  inboxItems
    .filter((i) => i.section === "attention")
    .forEach((item) => {
      candidates.push({
        label: item.title,
        detail: item.reason,
        href: item.href,
        urgency: item.priority === 0 ? "critical" : "high",
        kind: "blocker",
      });
    });

  inboxItems
    .filter((i) => i.section === "p1")
    .slice(0, 2)
    .forEach((item) => {
      candidates.push({
        label: item.title,
        detail: item.reason,
        href: item.href,
        urgency: "high",
        kind: "p1",
      });
    });

  inboxItems
    .filter((i) => i.section === "approaching")
    .slice(0, 2)
    .forEach((item) => {
      candidates.push({
        label: item.title,
        detail: item.reason,
        href: item.href,
        urgency: "high",
        kind: "decision",
      });
    });

  predictions
    .filter(
      (p) =>
        p.prediction.severity !== "low" &&
        (ownerMatches(sessionName, p.owner) || p.prediction.severity === "high")
    )
    .forEach((p) => {
      candidates.push({
        label: `${p.releaseCode} — ${p.name}`,
        detail: p.prediction.nudge,
        href: p.href,
        urgency: p.prediction.severity === "high" ? "critical" : "high",
        kind: "prediction",
      });
    });

  inboxItems
    .filter((i) => i.section === "mapping")
    .slice(0, 1)
    .forEach((item) => {
      candidates.push({
        label: item.title,
        detail: item.reason,
        href: item.href,
        urgency: "normal",
        kind: "booking",
      });
    });

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
    .filter((c) => {
      const key = `${c.href}|${c.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map((c, idx) => ({ ...c, rank: idx + 1 }));
}
