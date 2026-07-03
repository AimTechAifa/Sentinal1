import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function completeChat(opts: {
  system: string;
  messages: ChatMessage[];
  timeoutMs?: number;
}): Promise<{ text: string; provider: "openai" | "anthropic" }> {
  const run = async (): Promise<{ text: string; provider: "openai" | "anthropic" }> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });
      const res = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: opts.system },
          ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.3,
      });
      return { text: res.choices[0]?.message?.content ?? "", provider: "openai" };
    }

    if (anthropicKey) {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: opts.system,
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const block = res.content[0];
      return { text: block.type === "text" ? block.text : "", provider: "anthropic" };
    }

    throw new Error("No LLM API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local");
  };

  if (opts.timeoutMs) {
    return Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("LLM request timed out")), opts.timeoutMs)
      ),
    ]);
  }

  return run();
}
