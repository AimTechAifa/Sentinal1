import { ProgressLink } from "@/components/layout/NavigationProgress";
import { Bot, History, Plug, Share2 } from "lucide-react";

export function ReleaseRelatedLinks({ releaseId }: { releaseId: string }) {
  const links = [
    { href: "/agents", label: "Agents", icon: Bot },
    { href: "/connectors?filter=issues", label: "Connectors", icon: Plug },
    { href: `/history?release=${releaseId}`, label: "Audit trail", icon: History },
    { href: `/knowledge-graph?release=${releaseId}`, label: "Knowledge graph", icon: Share2 },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {links.map(({ href, label, icon: Icon }) => (
        <ProgressLink
          key={href}
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-theme-sm hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </ProgressLink>
      ))}
    </div>
  );
}
