import type { AgentMeta, AgentRole } from "./types";
import {
  Bot,
  Brain,
  FileText,
  GitBranch,
  MessageSquare,
  Network,
  Rocket,
  Scale,
  Shield,
  Sparkles,
  Ticket,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const AGENT_ICONS: Record<AgentRole, LucideIcon> = {
  "Ticket Agent": Ticket,
  "Build Agent": Wrench,
  "Approval Agent": Scale,
  "Dependency Agent": Network,
  "Risk Agent": Brain,
  "Summary Agent": FileText,
  "Conversation Agent": Sparkles,
  "Comms Agent": MessageSquare,
  "CAB Agent": Shield,
  "Deploy Agent": Rocket,
  "Security Agent": Shield,
  "SLO Agent": GitBranch,
  "Runbook Agent": FileText,
};

export const AGENT_GRADIENTS: Record<AgentRole, string> = {
  "Ticket Agent": "from-brand-400 via-brand-500 to-blue-500",
  "Build Agent": "from-orange-500 via-amber-500 to-yellow-500",
  "Approval Agent": "from-blue-500 via-brand-500 to-indigo-500",
  "Dependency Agent": "from-cyan-500 via-teal-500 to-emerald-500",
  "Risk Agent": "from-rose-500 via-red-500 to-orange-500",
  "Summary Agent": "from-brand-500 via-brand-400 to-blue-400",
  "Conversation Agent": "from-fuchsia-500 via-pink-500 to-rose-500",
  "Comms Agent": "from-sky-500 via-blue-500 to-indigo-500",
  "CAB Agent": "from-slate-600 via-gray-700 to-zinc-800",
  "Deploy Agent": "from-emerald-500 via-green-500 to-teal-500",
  "Security Agent": "from-red-600 via-rose-600 to-pink-600",
  "SLO Agent": "from-amber-500 via-orange-500 to-red-500",
  "Runbook Agent": "from-teal-500 via-cyan-500 to-blue-500",
};

export function getAgentIcon(role: AgentRole): LucideIcon {
  return AGENT_ICONS[role] ?? Bot;
}

export function getAgentGradient(agent: AgentMeta): string {
  return agent.accent || AGENT_GRADIENTS[agent.name] || "from-brand-400 to-brand-500";
}
