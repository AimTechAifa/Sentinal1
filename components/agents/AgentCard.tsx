"use client";

import { motion } from "framer-motion";
import { MagicCard } from "@/components/ui/magic-card";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { getAgentGradient, getAgentIcon } from "@/lib/agent-config";
import type { AgentMeta } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgentFindingsPanel } from "@/components/agents/AgentFindingsPanel";
import { Sparkles } from "lucide-react";

interface AgentCardProps {
  agent: AgentMeta;
  isPaused: boolean;
  onTogglePause: () => void;
  featured?: boolean;
}

export function AgentCard({ agent, isPaused, onTogglePause, featured }: AgentCardProps) {
  const Icon = getAgentIcon(agent.name);
  const gradient = getAgentGradient(agent);
  const maxSpark = Math.max(...agent.sparkline, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(featured && "md:col-span-2 xl:col-span-2")}
    >
      <MagicCard
        gradient={cn("bg-gradient-to-br", gradient)}
        beam={!isPaused && agent.status === "Active"}
        glow={!isPaused}
        className={cn("h-full transition-opacity", isPaused && "opacity-55 saturate-50")}
      >
        <div className="relative p-5 md:p-6 h-full flex flex-col">
          <DotPattern className="rounded-2xl" opacity={0.25} />

          <div className="relative flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3">
              <motion.div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                  gradient
                )}
                animate={isPaused ? {} : { scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <div>
                <ShimmerText className="text-sm font-bold">{agent.name}</ShimmerText>
                <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{agent.tagline}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={!isPaused}
                onChange={onTogglePause}
                className="sr-only peer"
              />
              <div className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-400 peer-checked:to-brand-500 peer-checked:after:translate-x-5" />
            </label>
          </div>

          <p className="relative text-sm text-gray-600 mb-1">{agent.description}</p>
          <p className="relative text-xs text-gray-400 mb-4">Watches: {agent.watches}</p>

          <div className="relative flex items-center justify-between text-xs mb-3">
            <span className={cn("inline-flex items-center gap-1.5 font-medium", isPaused ? "text-gray-400" : "text-emerald-600")}>
              {!isPaused && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulseDot" />}
              {isPaused ? "Paused" : `Active · ${agent.lastRanMinutesAgo}m ago`}
            </span>
            {agent.liveAi && (
              <span className="inline-flex items-center gap-1 text-brand-500 bg-brand-25 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> LLM
              </span>
            )}
          </div>

          <div className="relative flex items-end gap-1 h-10 mb-4">
            {agent.sparkline.map((v, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm origin-bottom"
                style={{
                  height: `${Math.max(12, (v / maxSpark) * 100)}%`,
                  background: `linear-gradient(to top, rgba(122,90,248,0.2), rgba(70,95,255,${0.25 + (v / maxSpark) * 0.55}))`,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              />
            ))}
          </div>

          <div className="relative mt-auto pt-2 border-t border-gray-100">
            <AgentFindingsPanel agent={agent} isPaused={isPaused} />
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}
