"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useMemo } from "react";
import { ThemeModeProvider, useThemeMode } from "@/context/ThemeModeContext";
import { createMaterioTheme } from "@/lib/materio/theme";

function MaterioThemeInner({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createMaterioTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeModeProvider>
        <MaterioThemeInner>{children}</MaterioThemeInner>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
