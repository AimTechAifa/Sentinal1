"use client";

import { usePathname } from "next/navigation";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronsLeft, ChevronsRight, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TAGLINE } from "@/lib/brand";
import { QUICK_START_TEMPLATES } from "@/lib/quick-start-templates";
import { NAV_SECTIONS } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const {
    isExpanded,
    isMobileOpen,
    isWide,
    toggleSidebar,
    toggleMobileSidebar,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();

  const handleNavClick = () => {
    if (isMobileOpen) closeMobileSidebar();
  };

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <aside
      className={cn(
        "materio-sidebar fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-[var(--border)] shadow-sm transition-all duration-300 ease-in-out lg:top-0 lg:left-0 lg:h-screen lg:rounded-none",
        isWide ? "w-[var(--sidebar-width-expanded)]" : "w-[var(--sidebar-width-collapsed)]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-[var(--border)] px-4 py-5",
          isWide ? "justify-between gap-3" : "flex-col gap-3 lg:px-3"
        )}
      >
        <ProgressLink
          href="/dashboard"
          className={cn("flex min-w-0 items-center gap-2.5", !isWide && "lg:justify-center")}
          onClick={handleNavClick}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand dark:shadow-none">
            <Shield className="h-[20px] w-[20px] text-white" />
          </div>
          {isWide && (
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-gray-900 dark:text-white">Sentinel</span>
              <p className="mt-0.5 truncate text-[11px] leading-snug text-gray-500 dark:text-gray-400">{PRODUCT_TAGLINE}</p>
            </div>
          )}
        </ProgressLink>

        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "materio-sidebar-toggle flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-gray-500 dark:text-white/70 transition-all hover:bg-brand-50 dark:hover:bg-white/10 hover:text-brand-600 shadow-sm",
            isWide ? "h-8 w-8" : "h-8 w-8"
          )}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={section.title ?? `section-${sectionIndex}`} className={sectionIndex > 0 ? "mt-6" : ""}>
            {(section.title || sectionIndex === 0) && (
              <p
                className={cn(
                  "menu-section-label mb-2 px-2",
                  !isWide && "lg:mx-auto lg:w-6 lg:overflow-hidden lg:px-0 lg:text-center lg:text-[0px]"
                )}
                aria-hidden={!isWide}
              >
                {section.title ?? "Menu"}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map(({ href, label, icon: Icon, pulse }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <ProgressLink
                      href={href}
                      title={!isWide ? label : undefined}
                      onClick={handleNavClick}
                      className={cn(
                        "menu-item group",
                        active ? "menu-item-active" : "menu-item-inactive",
                        !isWide && "lg:justify-center lg:px-0"
                      )}
                    >
                      <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                        <Icon className="h-[22px] w-[22px] shrink-0" />
                      </span>
                      {isWide && <span className="flex-1 truncate">{label}</span>}
                      {isWide && pulse && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-ai animate-pulseDot" />
                      )}
                      {!isWide && (
                        <span className="menu-item-tooltip lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
                          {label}
                        </span>
                      )}
                    </ProgressLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {isWide && (
        <div className="shrink-0 border-t border-[var(--border)] px-3 py-4">
          <ProgressLink
            href="/templates"
            onClick={handleNavClick}
            className="block rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-sm transition-all hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-white/10"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-300">
              <Sparkles className="h-4 w-4 text-brand-500 dark:text-brand-400" />
              Templates
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-white/70 font-medium">
              {QUICK_START_TEMPLATES.length} guided demo scenarios
            </p>
          </ProgressLink>
        </div>
      )}
    </aside>
  );
}
