"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePageDocumentationContext } from "@/context/PageDocumentationContext";
import { getPageDocumentation, type PageDocKey } from "@/lib/page-documentation";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown, ChevronRight, CircleHelp, X } from "lucide-react";

/** Compact help control — opens a popup with Full Documentation + Quick Reference. */
export function PageDocumentation({
  pageKey,
  className,
}: {
  pageKey: PageDocKey;
  className?: string;
}) {
  const doc = getPageDocumentation(pageKey);
  const { openRequestId, registerPageDocumentationOpener } = usePageDocumentationContext();
  const [open, setOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(true);
  const [quickOpen, setQuickOpen] = useState(true);
  /** Ignore the request id present at mount so navigation doesn't re-open a prior "Know more". */
  const seenRequestIdRef = useRef<number | null>(null);

  const openModal = useCallback(() => {
    setFullOpen(true);
    setQuickOpen(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    registerPageDocumentationOpener(openModal);
    return () => registerPageDocumentationOpener(null);
  }, [registerPageDocumentationOpener, openModal]);

  useEffect(() => {
    if (seenRequestIdRef.current === null) {
      seenRequestIdRef.current = openRequestId;
      return;
    }
    if (openRequestId === seenRequestIdRef.current) return;
    seenRequestIdRef.current = openRequestId;
    if (openRequestId === 0) return;
    openModal();
  }, [openRequestId, openModal]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!doc) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-white/75 dark:hover:text-brand-400",
          className,
        )}
        aria-label={`Open ${doc.title} documentation`}
        title="Page help"
      >
        <CircleHelp className="h-3.5 w-3.5" />
        Help
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[var(--border)] dark:bg-[var(--card)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-doc-title"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                <h2 id="page-doc-title" className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {doc.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <DocSection
                title="Full Documentation"
                open={fullOpen}
                onToggle={() => setFullOpen((v) => !v)}
              >
                <div className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-white/70">
                  {doc.fullDocumentation.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </DocSection>

              <DocSection
                title="Quick Reference"
                open={quickOpen}
                onToggle={() => setQuickOpen((v) => !v)}
                last
              >
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-600 dark:text-white/70">
                  {doc.quickReference.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DocSection>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DocSection({
  title,
  open,
  onToggle,
  children,
  last,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn(!last && "border-b border-gray-100 dark:border-[var(--border)]")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <span>{title}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-[var(--border)] dark:bg-white/[0.02]">
          {children}
        </div>
      )}
    </div>
  );
}
