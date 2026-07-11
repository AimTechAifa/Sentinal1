"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import { useHoverCapable } from "@/hooks/useHoverCapable";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  text: string;
  className?: string;
  /** Accessible name for the trigger button. */
  label?: string;
  /** Optional custom trigger; defaults to CircleHelp icon. */
  children?: React.ReactNode;
  /** Preferred placement of the tip relative to the trigger. */
  placement?: "top" | "bottom";
};

type TipCoords = { top: number; left: number; placement: "top" | "bottom" };

/**
 * Shared info tip: hover-to-show on fine pointers, tap-to-toggle on touch.
 * Escape / outside click dismisses the open tip.
 * Tip is portaled to document.body so overflow-hidden cards/tiles cannot clip it.
 */
export function InfoTooltip({
  text,
  className,
  label = "More information",
  children,
  placement = "top",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TipCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const hoverCapable = useHoverCapable();
  const rootRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setCoords(null);
      return;
    }

    const update = () => {
      const trigger = rootRef.current;
      const tip = tipRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const tipH = tip?.offsetHeight ?? 0;
      const tipW = tip?.offsetWidth ?? 0;
      const gap = 8;
      const pad = 8;

      let nextPlacement = placement;
      if (placement === "top" && rect.top < tipH + gap + pad) {
        nextPlacement = "bottom";
      } else if (placement === "bottom" && window.innerHeight - rect.bottom < tipH + gap + pad) {
        nextPlacement = "top";
      }

      let left = rect.left + rect.width / 2;
      const halfW = tipW / 2 || 140;
      left = Math.min(window.innerWidth - pad - halfW, Math.max(pad + halfW, left));

      const top =
        nextPlacement === "top" ? rect.top - gap : rect.bottom + gap;

      setCoords({ top, left, placement: nextPlacement });
    };

    update();
    // Second pass after tip mounts so we have real dimensions for flip/clamp.
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, placement, text]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || tipRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tip =
    open && mounted
      ? createPortal(
          <div
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-[200] w-max max-w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-[var(--card)] px-4 py-3 text-left text-xs leading-snug text-[var(--foreground)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] dark:border-[var(--border)]",
              coords?.placement === "bottom" ? "" : "-translate-y-full",
              !coords && "invisible"
            )}
            style={
              coords
                ? { top: coords.top, left: coords.left }
                : { top: 0, left: 0 }
            }
          >
            {text}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex shrink-0", className)}
      onMouseEnter={() => {
        if (hoverCapable) setOpen(true);
      }}
      onMouseLeave={() => {
        if (hoverCapable) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => {
          if (!hoverCapable) setOpen((v) => !v);
        }}
        onFocus={() => {
          if (hoverCapable) setOpen(true);
        }}
        onBlur={(e) => {
          if (!hoverCapable) return;
          if (!rootRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
      >
        {children ?? <CircleHelp size={14} strokeWidth={2} />}
      </button>
      {tip}
    </div>
  );
}
