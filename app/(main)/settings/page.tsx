"use client";

import { Suspense, useEffect, useState } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Bell,
  Shield,
  Plug,
  Settings as SettingsIcon,
  Building2,
  Package,
  Server,
  UserCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamMembersTab } from "@/components/settings/TeamMembersTab";
import { DepartmentsTab } from "@/components/settings/master-data/DepartmentsTab";
import { ApplicationsTab } from "@/components/settings/master-data/ApplicationsTab";
import { EnvironmentsTab } from "@/components/settings/master-data/EnvironmentsTab";
import { UsersTab } from "@/components/settings/master-data/UsersTab";
import { RiskFactorsTab } from "@/components/settings/master-data/RiskFactorsTab";

const VALID_TABS = new Set([
  "general",
  "team",
  "departments",
  "applications",
  "environments",
  "users",
  "risk-factors",
  "notifications",
  "integrations",
  "security",
]);

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "team";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tabParam && VALID_TABS.has(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const setTab = (id: string) => {
    setActiveTab(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === "team") {
      params.delete("tab");
    } else {
      params.set("tab", id);
    }
    const qs = params.toString();
    router.replace(qs ? `/settings?${qs}` : "/settings", { scroll: false });
  };

  const sidebarNav = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "team", label: "Team Members", icon: Users },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "applications", label: "Applications", icon: Package },
    { id: "environments", label: "Environments", icon: Server },
    { id: "users", label: "Users", icon: UserCircle },
    { id: "risk-factors", label: "Risk Factors", icon: AlertTriangle },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "security", label: "Security", icon: Shield },
  ];

  const masterDataTabs = new Set(["departments", "applications", "environments", "users", "risk-factors"]);

  return (
    <div className="max-w-[1200px] font-sans pb-24">
      <div className="mb-10 mt-2">
        <h1 className="text-[32px] font-bold text-[#111827] tracking-tight mb-2">Settings</h1>
        <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
          Manage your account settings, team configuration, and master data ingestion.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-[240px] shrink-0">
          <nav className="flex flex-col gap-1">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors text-left",
                    isActive
                      ? "bg-[#EFF3FF] text-[#2548C9]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === "team" && <TeamMembersTab />}
          {activeTab === "departments" && <DepartmentsTab />}
          {activeTab === "applications" && <ApplicationsTab />}
          {activeTab === "environments" && <EnvironmentsTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "risk-factors" && <RiskFactorsTab />}

          {!masterDataTabs.has(activeTab) && activeTab !== "team" && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
              <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <SettingsIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Module Coming Soon</h3>
              <p className="text-[14px] text-gray-500 mt-1 max-w-sm">
                This configuration section is currently under development. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <SettingsPageInner />
    </Suspense>
  );
}
