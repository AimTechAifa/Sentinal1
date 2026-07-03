"use client";

import type { AgentRole, BuildExplanation, DependencyWarning, RiskFlag } from "./types";

interface AgentRequest {
  agentRole: AgentRole;
  context: object;
  userMessage?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  mode?: "structured" | "line" | "prose";
}

interface AgentResponse {
  text?: string;
  flags?: RiskFlag[];
  build?: BuildExplanation;
  warnings?: DependencyWarning[];
  error?: string;
}

export async function callAgent(req: AgentRequest): Promise<AgentResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      return { error: err.error ?? "AI unavailable" };
    }
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { error: "AI request timed out — try again" };
    }
    return { error: "AI request failed" };
  } finally {
    clearTimeout(timeout);
  }
}
