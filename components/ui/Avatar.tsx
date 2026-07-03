import { cn } from "@/lib/utils";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-info-500", "bg-brand-500", "bg-success-500", "bg-warning-500", "bg-error-500"];
  const color = colors[name.length % colors.length];
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-medium", color, size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm")}>
      {initials}
    </div>
  );
}
