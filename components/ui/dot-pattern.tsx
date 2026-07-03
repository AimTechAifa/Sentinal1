import { cn } from "@/lib/utils";

interface DotPatternProps {
  className?: string;
  opacity?: number;
}

/** 21st.dev / Magic UI dot grid background */
export function DotPattern({ className, opacity = 0.35 }: DotPatternProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity,
        backgroundImage: "radial-gradient(circle, rgb(148 163 184 / 0.5) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}
