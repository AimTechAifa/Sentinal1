import { AppShell } from "@/components/layout/AppShell";
import { NavigationProgressProvider } from "@/components/layout/NavigationProgress";
import { MuiThemeProvider } from "@/components/providers/MuiThemeProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider>
      <NavigationProgressProvider>
        <AppShell>{children}</AppShell>
      </NavigationProgressProvider>
    </MuiThemeProvider>
  );
}
