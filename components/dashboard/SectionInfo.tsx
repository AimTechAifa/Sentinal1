"use client";

import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

/** Dashboard section (i) tip — hover on desktop, tap-to-toggle on touch. */
export function SectionInfo({ text, className }: { text: string; className?: string }) {
  return (
    <InfoTooltip
      text={text}
      label="Section information"
      className={cn(className)}
      placement="top"
    />
  );
}
