"use client";

import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { Backdrop } from "./Backdrop";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PageDocumentationProvider } from "@/context/PageDocumentationContext";
import { NewUserWelcomeModal } from "@/components/help/HelpCenterModal";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ReleaseStoreProvider } from "@/context/ReleaseStoreContext";
import { ReleaseFiltersProvider } from "@/context/ReleaseFiltersContext";
import { ColumnPreferencesProvider } from "@/context/ColumnPreferencesProvider";
import { cn } from "@/lib/utils";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isMobileOpen } = useSidebar();

  return (
    <ChatProvider>
      <div className="min-h-screen materio-page-bg">
        <Sidebar />
        <Backdrop />
        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ease-in-out min-w-0",
            isMobileOpen ? "ml-0" : "lg:ml-[var(--sidebar-width)]"
          )}
        >
          <AppHeader />
          <main className="materio-main flex-1 px-4 pb-6 pt-6 md:px-6 lg:px-8 min-w-0">
            {children}
          </main>
          <ChatPanel />
          <NewUserWelcomeModal />
        </div>
      </div>
    </ChatProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReleaseStoreProvider>
        <Suspense fallback={null}>
          <ColumnPreferencesProvider>
            <PageDocumentationProvider>
              <ReleaseFiltersProvider>
                <ShellInner>{children}</ShellInner>
              </ReleaseFiltersProvider>
            </PageDocumentationProvider>
          </ColumnPreferencesProvider>
        </Suspense>
      </ReleaseStoreProvider>
    </SidebarProvider>
  );
}
