import { getConnectorBlockers } from "./connectors";
import { getBlockers } from "./utils";
import type { Release } from "./types";

export type ReleaseBlocker = { text: string; href?: string };

export function getReleaseBlockers(release: Release): ReleaseBlocker[] {
  const connectorBlockers = getConnectorBlockers(release);
  const connectorTexts = new Set(connectorBlockers.map((b) => b.text));
  const plain = getBlockers(release)
    .filter((text) => !connectorTexts.has(text))
    .map((text) => ({ text }));
  return [...plain, ...connectorBlockers];
}
