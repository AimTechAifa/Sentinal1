import { NextRequest, NextResponse } from "next/server";
import { getAgentSystemPrompt, isStructuredAgent } from "@/lib/agent-prompts";
import { completeChat } from "@/lib/llm";
import type { AgentRole } from "@/lib/types";

function parseJson<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentRole, context, userMessage, conversationHistory, mode } = body as {
      agentRole: AgentRole;
      context: object;
      userMessage?: string;
      conversationHistory?: { role: "user" | "assistant"; content: string }[];
      mode?: "structured" | "line" | "prose";
    };

    const structured = isStructuredAgent(agentRole, mode);
    const system = getAgentSystemPrompt(agentRole, structured);

    const contextMsg = `Context JSON:\n${JSON.stringify(context, null, 2)}`;
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    if (conversationHistory?.length) {
      messages.push(...conversationHistory);
    }

    if (userMessage) {
      messages.push({ role: "user", content: `${contextMsg}\n\nUser question: ${userMessage}` });
    } else {
      messages.push({ role: "user", content: contextMsg });
    }

    const { text, provider } = await completeChat({ system, messages });

    if (agentRole === "Risk Agent" && structured) {
      const flags = parseJson<unknown[]>(text);
      if (flags) return NextResponse.json({ flags, provider });
    }
    if (agentRole === "Build Agent" && structured) {
      const build = parseJson<object>(text);
      if (build) return NextResponse.json({ build, provider });
    }
    if (agentRole === "Dependency Agent" && structured) {
      const warnings = parseJson<unknown[]>(text);
      if (warnings) return NextResponse.json({ warnings, provider });
    }

    return NextResponse.json({ text, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
