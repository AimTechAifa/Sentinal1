"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ThemeMode } from "@/lib/materio/theme";

const STORAGE_KEY = "sentinel-theme-mode";

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const MODES: ThemeMode[] = ["light", "dark"];

function normalizeMode(v: string | null): ThemeMode {
  if (v === "dark" || v === "semi-dark") return "dark";
  if (v === "light") return "light";
  return "light";
}

function applyDomMode(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.remove("theme-light", "theme-dark", "theme-semi-dark");
  root.classList.add(`theme-${mode}`);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const resolved = normalizeMode(stored);
    setModeState(resolved);
    applyDomMode(resolved);
    if (stored === "semi-dark") {
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyDomMode(next);
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((current) => {
      const idx = MODES.indexOf(current);
      const next = MODES[(idx + 1) % MODES.length];
      localStorage.setItem(STORAGE_KEY, next);
      applyDomMode(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, cycleMode }), [mode, setMode, cycleMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}
