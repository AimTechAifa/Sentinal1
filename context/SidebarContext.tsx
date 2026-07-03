"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const SIDEBAR_WIDTH_EXPANDED = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 78;
const STORAGE_KEY = "sentinel-sidebar-expanded";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  isWide: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (v: boolean) => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function readStoredExpanded(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIsExpanded(readStoredExpanded());
    setHydrated(true);
  }, []);

  const isWide = isExpanded || isHovered || isMobileOpen;
  const sidebarWidth = isWide ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(isExpanded));
    } catch {
      /* ignore */
    }
  }, [isExpanded, hydrated]);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((p) => !p);
    setIsHovered(false);
  }, []);

  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((p) => !p), []);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  const value = useMemo(
    () => ({
      isExpanded,
      isMobileOpen,
      isHovered,
      isWide,
      sidebarWidth,
      toggleSidebar,
      toggleMobileSidebar,
      setIsHovered,
      closeMobileSidebar,
    }),
    [
      isExpanded,
      isMobileOpen,
      isHovered,
      isWide,
      sidebarWidth,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
