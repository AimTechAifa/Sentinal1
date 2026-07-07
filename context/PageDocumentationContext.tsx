"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type PageDocumentationContextValue = {
  openRequestId: number;
  requestPageDocumentationOpen: () => void;
  registerPageDocumentationOpener: (opener: (() => void) | null) => void;
};

const PageDocumentationContext = createContext<PageDocumentationContextValue | null>(null);

export function PageDocumentationProvider({ children }: { children: ReactNode }) {
  const [openRequestId, setOpenRequestId] = useState(0);
  const openerRef = useRef<(() => void) | null>(null);

  const registerPageDocumentationOpener = useCallback((opener: (() => void) | null) => {
    openerRef.current = opener;
  }, []);

  const requestPageDocumentationOpen = useCallback(() => {
    setOpenRequestId((n) => n + 1);
    openerRef.current?.();
  }, []);

  return (
    <PageDocumentationContext.Provider
      value={{ openRequestId, requestPageDocumentationOpen, registerPageDocumentationOpener }}
    >
      {children}
    </PageDocumentationContext.Provider>
  );
}

export function usePageDocumentationContext() {
  const ctx = useContext(PageDocumentationContext);
  if (!ctx) {
    throw new Error("usePageDocumentationContext must be used within PageDocumentationProvider");
  }
  return ctx;
}

export function usePageDocumentationTrigger() {
  const ctx = useContext(PageDocumentationContext);
  return { requestPageDocumentationOpen: ctx?.requestPageDocumentationOpen ?? (() => {}) };
}
