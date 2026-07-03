"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function inlineFormat(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-gray-100 dark:bg-white/10 px-1 py-0.5 text-[12px] font-mono text-brand-700 dark:text-brand-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function ChatMessageContent({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {blocks.map((block, bi) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={bi} className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {inlineFormat(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={bi} className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {inlineFormat(trimmed.slice(3))}
            </h3>
          );
        }

        const lines = trimmed.split("\n");
        const isList = lines.every((l) => /^[-*•]\s/.test(l.trim()) || l.trim() === "");
        if (isList) {
          return (
            <ul key={bi} className="space-y-1.5 pl-1">
              {lines
                .filter((l) => l.trim())
                .map((line, li) => (
                  <li key={li} className="flex gap-2 text-gray-700 dark:text-white/90">
                    <span className="text-brand-500 dark:text-brand-400 mt-0.5 shrink-0">•</span>
                    <span>{inlineFormat(line.replace(/^[-*•]\s*/, ""))}</span>
                  </li>
                ))}
            </ul>
          );
        }

        const isNumbered = lines.every((l) => /^\d+\.\s/.test(l.trim()) || l.trim() === "");
        if (isNumbered) {
          return (
            <ol key={bi} className="space-y-1.5 pl-1 list-none">
              {lines
                .filter((l) => l.trim())
                .map((line, li) => (
                  <li key={li} className="flex gap-2 text-gray-700 dark:text-white/90">
                    <span className="text-brand-600 dark:text-brand-400 font-semibold shrink-0 w-5">
                      {line.match(/^(\d+)\./)?.[1]}.
                    </span>
                    <span>{inlineFormat(line.replace(/^\d+\.\s*/, ""))}</span>
                  </li>
                ))}
            </ol>
          );
        }

        if (trimmed.startsWith("**Sources:**") || trimmed.startsWith("Sources:")) {
          return (
            <div
              key={bi}
              className="mt-2 rounded-lg border border-brand-100 dark:border-[var(--border)] bg-brand-50/60 dark:bg-white/5 px-3 py-2 text-xs text-gray-600 dark:text-white/70"
            >
              {inlineFormat(trimmed)}
            </div>
          );
        }

        return (
          <p key={bi} className="text-gray-700 dark:text-white/90">
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {inlineFormat(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
