import type { ActivityFeedItem } from "./types";

export function activityFeedHref(item: ActivityFeedItem): string | null {
  if (item.releaseId) return `/releases/${item.releaseId}`;
  if (item.agent === "Summary Agent") return "/executive";
  if (item.agent === "Risk Agent" || item.agent === "Conversation Agent") return "/insights";
  return null;
}
