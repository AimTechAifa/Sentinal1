import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { buildConversationContext } from "@/lib/conversation-context";
import { runConversationAgent } from "@/lib/conversation-agent";

export async function POST(req: Request) {
  const { user, error } = await requireRole("readonly");
  if (error) return error;

  try {
    const body = await req.json();
    const { message, history, currentPath } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      currentPath?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const context = await buildConversationContext(user?.name ?? "", currentPath);
    const { text, provider } = await runConversationAgent({
      context,
      userMessage: message.trim(),
      history: history ?? [],
    });

    return NextResponse.json({ text, provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
