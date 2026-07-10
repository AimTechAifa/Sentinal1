"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const SIDEBAR_WIDTH_EXPANDED = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 80;
const STORAGE_KEY = "sentinel-sidebar-expanded";
/** Delay before hover-peek collapses after mouse leaves (avoids flicker). */
export const SIDEBAR_HOVER_LEAVE_DELAY_MS = 280;

type SidebarContextType = {
  /** Manual pin: sidebar stays fully open across navigations. */
  isExpanded: boolean;
  isMobileOpen: boolean;
  /**
   * Temporary hover expand while collapsed.
   * Pushes page content (margin tracks width) — never overlays, so no bleed-through.
   */
  isHovered: boolean;
  /**
   * After a nav click, ignore live hover until the pointer leaves the sidebar.
   * Prevents expand staying open when the cursor never left the rail.
   */
  hoverPeekLocked: boolean;
  /** Sidebar is visually wide (pin, mobile, or active hover). */
  isWide: boolean;
  /** Layout margin for page content — matches visual width so hover never overlaps. */
  contentSidebarWidth: number;
  /** Visual sidebar width (same as contentSidebarWidth). */
  sidebarWidth: number;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (v: boolean) => void;
  /** Call on nav / route change: collapse hover expand and lock until mouseleave. */
  collapsePeekAfterNavigation: () => void;
  /** Call on mouseleave: allow hover-expand again on the next mouseenter. */
  unlockHoverPeek: () => void;
  /** Clear hover + unlock (e.g. pin toggle). */
  clearHoverPeek: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function readStoredExpanded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPeekLocked, setHoverPeekLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIsExpanded(readStoredExpanded());
    setHydrated(true);
  }, []);

  // Wide = pin, mobile drawer, or hover expand. Content margin always matches — no overlay.
  const isWide = isExpanded || isMobileOpen || (isHovered && !hoverPeekLocked);
  const contentSidebarWidth = isWide ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
  const sidebarWidth = contentSidebarWidth;

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(isExpanded));
    } catch {
      /* ignore */
    }
  }, [isExpanded, hydrated]);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${contentSidebarWidth}px`);
  }, [contentSidebarWidth]);

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
    setHoverPeekLocked(false);
  }, []);

  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((p) => !p), []);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  const collapsePeekAfterNavigation = useCallback(() => {
    setIsHovered(false);
    setHoverPeekLocked(true);
    setIsMobileOpen(false);
  }, []);

  const unlockHoverPeek = useCallback(() => {
    setHoverPeekLocked(false);
  }, []);

  const clearHoverPeek = useCallback(() => {
    setHoverPeekLocked(false);
    setIsHovered(false);
  }, []);

  const value = useMemo(
    () => ({
      isExpanded,
      isMobileOpen,
      isHovered,
      hoverPeekLocked,
      isWide,
      contentSidebarWidth,
      sidebarWidth,
      toggleSidebar,
      toggleMobileSidebar,
      setIsHovered,
      collapsePeekAfterNavigation,
      unlockHoverPeek,
      clearHoverPeek,
      closeMobileSidebar,
    }),
    [
      isExpanded,
      isMobileOpen,
      isHovered,
      hoverPeekLocked,
      isWide,
      contentSidebarWidth,
      sidebarWidth,
      toggleSidebar,
      toggleMobileSidebar,
      collapsePeekAfterNavigation,
      unlockHoverPeek,
      clearHoverPeek,
      closeMobileSidebar,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
