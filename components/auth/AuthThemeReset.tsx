"use client";

import { useEffect } from "react";

/** Auth pages always render in light mode — avoids global dark CSS breaking Clerk. */
export function AuthThemeReset({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const prevClass = root.className;
    const prevScheme = root.style.colorScheme;
    const prevDataset = root.dataset.theme;

    root.classList.remove("theme-dark", "theme-semi-dark");
    root.classList.add("theme-light");
    root.dataset.theme = "light";
    root.style.colorScheme = "light";

    return () => {
      root.className = prevClass;
      root.style.colorScheme = prevScheme;
      if (prevDataset) root.dataset.theme = prevDataset;
      else delete root.dataset.theme;
    };
  }, []);

  return <>{children}</>;
}
